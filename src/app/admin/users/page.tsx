
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { User } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersFromDb = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as User));
      setUsers(usersFromDb);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">User Coins</h1>
      <p className="text-muted-foreground">
        A list of all registered users and their current coin balance.
      </p>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead className="text-right">Coins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="h-12 w-1/2 bg-muted rounded animate-pulse"></TableCell>
                  <TableCell className="h-12 w-1/2 bg-muted rounded animate-pulse"></TableCell>
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-right">
                     <Badge variant="secondary" className="text-base">
                        <Coins className="mr-2 h-4 w-4 text-yellow-500"/>
                        {user.coins ?? 0}
                     </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
