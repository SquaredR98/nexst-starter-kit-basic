'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/api-client';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await apiClient.patch('/users/profile', data);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your personal information and profile details.
        </p>
      </div>

      {/* Profile Picture Section */}
      <div className="bg-white border border-black/20 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-black mb-4">Profile Picture</h3>
          <div className="flex items-center space-x-6">
            {user.profile?.avatarUrl ? (
              <img
                className="h-24 w-24 rounded-full"
                src={user.profile.avatarUrl}
                alt="Profile"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-black flex items-center justify-center text-white text-2xl font-semibold">
                {getInitials(user.profile?.firstName, user.profile?.lastName)}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Upload a new profile picture or use your avatar from connected accounts.
              </p>
              <Button variant="outline" size="sm" disabled>
                Change Picture (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white border border-black/20 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-black mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  type="text"
                  placeholder="John"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <Input
                  label="Last Name"
                  type="text"
                  placeholder="Doe"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    aria-label="Email Address"
                    className="flex h-12 w-full rounded-lg border border-black/20 bg-gray-50 px-4 py-3 text-base text-gray-600 cursor-not-allowed"
                  />
                  {user.emailVerified && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="inline-flex items-center text-xs text-black">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Bio
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us a bit about yourself..."
                  className="flex w-full rounded-lg border border-black/20 bg-white px-4 py-3 text-base text-black placeholder:text-gray-400 focus:outline-none focus:border-black/40 transition-all duration-200 hover:border-black/30"
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-600">
                  Brief description for your profile. Max 500 characters.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>

      {/* Account Information */}
      <div className="bg-white border border-black/20 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-black mb-4">Account Information</h3>
          <dl className="divide-y divide-black/10">
            <div className="py-3 flex justify-between text-sm">
              <dt className="text-gray-600">Account ID</dt>
              <dd className="text-black font-mono text-xs">{user.id}</dd>
            </div>
            <div className="py-3 flex justify-between text-sm">
              <dt className="text-gray-600">Roles</dt>
              <dd>
                {user.roles && user.roles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((userRole) => (
                      <span
                        key={userRole.role.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white"
                      >
                        {userRole.role.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No roles assigned</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
