import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountDeletion() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const user = await base44.auth.me();
      
      // Delete user data based on role
      if (user.role === 'admin') {
        // Admin: Delete church data
        const churchSettings = await base44.entities.ChurchSettings.filter({ created_by: user.email });
        for (const setting of churchSettings) {
          await base44.entities.ChurchSettings.delete(setting.id);
        }
        
        const subscriptions = await base44.entities.Subscription.filter({ church_admin_email: user.email });
        for (const sub of subscriptions) {
          await base44.entities.Subscription.delete(sub.id);
        }
      }
      
      // Delete member record
      const members = await base44.entities.Member.filter({ email: user.email });
      for (const member of members) {
        await base44.entities.Member.delete(member.id);
      }
      
      // Logout and redirect
      toast.success('Account deleted successfully');
      setTimeout(() => {
        base44.auth.logout();
      }, 1000);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete account: ' + (error.message || 'Unknown error'));
      setIsDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Request Account Deletion
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          Confirm Account Deletion
        </CardTitle>
        <CardDescription className="text-red-700 dark:text-red-300">
          This action cannot be undone. All your data will be permanently deleted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-red-900 dark:text-red-400">
            Type <span className="font-bold">DELETE</span> to confirm
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="bg-white dark:bg-slate-800"
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowConfirm(false);
              setConfirmText('');
            }}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || isDeleting}
            className="flex-1"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Forever
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}