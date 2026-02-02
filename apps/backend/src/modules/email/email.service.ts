import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM');

    // If no SMTP config, log warning and use ethereal for development
    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP configuration not found. Emails will be logged only. For production, configure SMTP settings.',
      );
      // In development, we'll create a test account
      this.createTestAccount();
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      from,
    });

    this.logger.log('Email service initialized with SMTP configuration');
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(
        `Email service initialized with Ethereal test account: ${testAccount.user}`,
      );
    } catch (error) {
      this.logger.error('Failed to create test email account', error);
    }
  }

  private getTemplate(templateName: string): HandlebarsTemplateDelegate {
    // Check cache first
    const cachedTemplate = this.templatesCache.get(templateName);
    if (cachedTemplate) {
      return cachedTemplate;
    }

    // Load template from file
    const templatePath = path.join(
      __dirname,
      'templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      this.logger.error(`Template not found: ${templatePath}`);
      throw new Error(`Email template '${templateName}' not found`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);

    // Cache the compiled template
    this.templatesCache.set(templateName, template);

    return template;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const template = this.getTemplate(options.template);
      const html = template(options.context);

      const from =
        this.configService.get<string>('SMTP_FROM') ||
        'NEXST Starter Kit <noreply@nexst.dev>';

      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);

      // If using Ethereal, log the preview URL
      if (info.messageId && this.configService.get('NODE_ENV') !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`Preview URL: ${previewUrl}`);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string,
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'verification',
      context: {
        firstName,
        verificationUrl,
        email,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'reset-password',
      context: {
        firstName,
        resetUrl,
        email,
      },
    });
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/dashboard`;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to NEXST Starter Kit',
      template: 'welcome',
      context: {
        firstName,
        dashboardUrl,
        email,
      },
    });
  }

  async send2FACodeEmail(
    email: string,
    firstName: string,
    code: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your Two-Factor Authentication Code',
      template: '2fa-code',
      context: {
        firstName,
        code,
        email,
      },
    });
  }
}
