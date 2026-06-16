import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Shield, User, QrCode, Download, Clock, Trash2, Edit2, Ban, CheckCircle, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';

export default function UsersPage() {

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // user object
  const [sortBy, setSortBy] = useState('namn');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const qrRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin';
  const currentUserId = currentUser?.id;

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res?.data?.users || [];
    },
    enabled: !!currentUser,
    retry: 1
  });

  const { data: invitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => base44.entities.Invitation.list(),
    initialData: []
  });

  // Pending = invited but not yet a registered user
  const pendingInvitations = invitations.filter(
    inv => !users.some(u => u.email?.toLowerCase() === inv.email?.toLowerCase())
  );

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
      const me = await base44.auth.me();
      await base44.entities.Invitation.create({ email, role, invited_by: me.email });
    },
    onSuccess: () => {
      toast.success('Användaren har bjudits in');
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteRole('user');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte bjuda in användaren');
    }
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: (id) => base44.entities.Invitation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    }
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (inv) => {
      await base44.users.inviteUser(inv.email, inv.role);
    },
    onSuccess: () => {
      toast.success('Ny inbjudan har skickats');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte skicka inbjudan');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => base44.entities.User.update(userId, { role }),
    onSuccess: () => {
      toast.success('Användarrollen har uppdaterats');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte uppdatera rollen');
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ userId, blocked }) => base44.entities.User.update(userId, { blocked }),
    onSuccess: (_, { blocked }) => {
      toast.success(blocked ? 'Användaren har blockerats' : 'Användaren har avblocketrats');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      toast.success('Användaren har tagits bort');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const [editRole, setEditRole] = useState('user');

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, first_name, last_name, role, email }) => 
      base44.entities.User.update(userId, { first_name, last_name, role, email }),
    onSuccess: () => {
      toast.success('Användaren har uppdaterats');
      setIsEditOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte uppdatera användaren');
    }
  });

  const resendUserInviteMutation = useMutation({
    mutationFn: async (user) => {
      await base44.users.inviteUser(user.email, user.role);
    },
    onSuccess: () => toast.success('Ny inbjudningslänk har skickats'),
    onError: (error) => toast.error(error.message || 'Kunde inte skicka länk')
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error('Ange en e-postadress');
      return;
    }
    if (!inviteFirstName.trim() || !inviteLastName.trim()) {
      toast.error('Ange förnamn och efternamn');
      return;
    }
    inviteMutation.mutate({ 
      email: inviteEmail, 
      role: inviteRole
    });
  };

  const handleRoleChange = (userId, newRole) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'user');
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editFirstName.trim() || !editLastName.trim()) {
      toast.error('Ange förnamn och efternamn');
      return;
    }
    updateUserMutation.mutate({
      userId: editingUser.id,
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      role: editRole,
      email: editEmail.trim()
    });
  };

  if (!currentUser) return null;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Du har inte behörighet att se denna sida.</p>
    </div>
  );

  return (
    <>
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Användarhantering</h1>
            <p className="text-gray-600 mt-1">Hantera användare och deras roller</p>
          </div>

          <div className="flex gap-2 flex-wrap items-center w-full md:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sortera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="namn">Namn</SelectItem>
                <SelectItem value="roll">Roll</SelectItem>
                <SelectItem value="datum">Datum</SelectItem>
                <SelectItem value="senast">Senast använd</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowQRCode(true)}
              variant="outline"
              size="icon"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              title="QR Code"
            >
              <QrCode className="w-4 h-4" />
            </Button>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Bjud in användare
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bjud in ny användare</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-postadress</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="anvandare@exempel.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="first_name">Förnamn</Label>
                  <Input
                    id="first_name"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Efternamn</Label>
                  <Input
                    id="last_name"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Roll</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Användare</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? 'Skickar...' : 'Skicka inbjudan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>


        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Laddar användare...</p>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-500 mb-2">Kunde inte ladda användare</p>
              <p className="text-xs text-gray-400">{error?.message}</p>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Inga användare hittades</p>
              <Button onClick={() => setIsInviteOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Bjud in första användaren
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {[...users].sort((a, b) => {
              if (sortBy === 'namn') return (`${a.first_name || ''} ${a.last_name || ''}`.trim() || a.full_name || '').localeCompare((`${b.first_name || ''} ${b.last_name || ''}`.trim() || b.full_name || ''), 'sv');
              if (sortBy === 'roll') return (a.role || '').localeCompare(b.role || '');
              if (sortBy === 'datum') return new Date(b.created_date) - new Date(a.created_date);
              if (sortBy === 'senast') return new Date(b.updated_date) - new Date(a.updated_date);
              return 0;
            }).map((user) => (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3">
                    {/* Top row: avatar + info + badge */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex-shrink-0 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.full_name || 'Inget namn'}</h3>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs text-gray-400">Gick med {new Date(user.created_date).toLocaleDateString('sv-SE')}</p>
                      </div>
                      <Badge 
                        className={`flex-shrink-0 ${user.blocked ? 'bg-red-100 text-red-700' : user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.blocked ? 'Blockerad' : user.role}
                      </Badge>
                    </div>
                    {/* Bottom row: actions */}
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <Select 
                        value={user.role} 
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={updateRoleMutation.isPending || user.id === currentUserId}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Användare</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        disabled={user.id === currentUserId}
                        title="Redigera"
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {user.id !== currentUserId && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={user.blocked ? 'Avblockera' : 'Blockera'}
                            className={`h-8 w-8 ${user.blocked ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'}`}
                            onClick={() => blockUserMutation.mutate({ userId: user.id, blocked: !user.blocked })}
                            disabled={blockUserMutation.isPending}
                          >
                            {user.blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ta bort användare"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setConfirmDelete(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Väntande inbjudningar ({pendingInvitations.length})
        </h2>
        {pendingInvitations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Inga väntande inbjudningar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {pendingInvitations.map((inv) => (
              <Card key={inv.id} className="border-amber-200 bg-amber-50">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex-shrink-0 bg-amber-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{inv.email}</p>
                      <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          {inv.role === 'admin' ? 'Admin' : 'Användare'}
                        </Badge>
                        <span>Inbjuden {new Date(inv.created_date).toLocaleDateString('sv-SE')}</span>
                        {inv.invited_by && <span className="truncate">av {inv.invited_by}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-amber-500 hover:text-amber-700 hover:bg-amber-100"
                        title="Skicka ny inbjudan"
                        onClick={() => resendInvitationMutation.mutate(inv)}
                        disabled={resendInvitationMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => deleteInvitationMutation.mutate(inv.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redigera användare</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <Label htmlFor="edit_email">E-postadress</Label>
            <Input
              id="edit_email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_first_name">Förnamn</Label>
            <Input
              id="edit_first_name"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_last_name">Efternamn</Label>
            <Input
              id="edit_last_name"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_role">Roll</Label>
            <Select value={editRole} onValueChange={setEditRole}>
              <SelectTrigger id="edit_role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Användare</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
              onClick={() => resendUserInviteMutation.mutate(editingUser)}
              disabled={resendUserInviteMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {resendUserInviteMutation.isPending ? 'Skickar...' : 'Skicka ny länk'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Sparar...' : 'Spara'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ta bort användare?</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmDelete && `${confirmDelete.full_name || confirmDelete.email} kommer att tas bort permanent. Detta kan inte ångras.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={() => deleteUserMutation.mutate(confirmDelete.id)}
          >
            Ta bort
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Skanna QR-kod</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <QRCodeCanvas
            ref={qrRef}
            value={window.location.origin}
            size={256}
            level="H"
            includeMargin={true}
          />
          <p className="text-sm text-gray-600 text-center">
            Skanna denna kod med din telefon för att öppna appen
          </p>
          <p className="text-xs text-gray-500 text-center break-all px-4">
            {window.location.origin}
          </p>
          <Button
            variant="outline"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            onClick={() => {
              const canvas = qrRef.current;
              if (!canvas) return;
              const url = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = url;
              a.download = 'qr-kod.png';
              a.click();
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Ladda ner QR-kod
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}