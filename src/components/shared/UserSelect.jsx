import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UserSelect({ value, onValueChange, placeholder = 'Välj användare (valfritt)' }) {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  return (
    <Select value={value || '__none__'} onValueChange={v => onValueChange(v === '__none__' ? '' : v)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Ingen</SelectItem>
        {users.map(user => {
          const displayName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.full_name || user.email;
          return (
            <SelectItem key={user.id} value={user.id}>
              {displayName}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}