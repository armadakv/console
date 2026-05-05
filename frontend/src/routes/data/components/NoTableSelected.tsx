import { Link } from '@tanstack/react-router';
import { Plus, Table } from 'lucide-react';
import React from 'react';

import { useTables } from '@/hooks/useApi';
import { Button } from '@/ui/Button';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';

const NoTableSelected: React.FC = () => {
  const { data: tables, isLoading } = useTables();

  // Show different content based on whether any tables exist
  const noTablesExist = !isLoading && (!tables || tables.length === 0);

  return (
    <Card className="min-h-48 flex flex-col justify-center items-center p-6 text-center">
      <CardContent>
        <Table className="w-15 h-15 text-slate-400 mb-4 opacity-50 mx-auto" />

        <Typography variant="h6" className="mb-2">
          {noTablesExist ? 'No Tables Found' : 'Select a Table'}
        </Typography>

        <Typography variant="body2" className="text-slate-400 max-w-md mx-auto mb-4">
          {noTablesExist
            ? "You don't have any tables created yet. Create a table to start adding key-value pairs."
            : 'Please select a table from the sidebar or the list above to view and manage its key-value pairs.'}
        </Typography>

        {noTablesExist && (
          <div className="mt-4">
            <Link to="/settings">
              <Button variant="primary" className="inline-flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create New Table
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoTableSelected;
