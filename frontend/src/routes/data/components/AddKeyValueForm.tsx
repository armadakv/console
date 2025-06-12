import { Loader, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { useAddKeyValuePair } from '@/hooks/useApi';
import { ErrorState } from '@/shared/ErrorState';
import { SuccessState } from '@/shared/SuccessState';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';

interface AddKeyValueFormProps {
  selectedTable: string;
}

const AddKeyValueForm: React.FC<AddKeyValueFormProps> = ({ selectedTable }) => {
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const addMutation = useAddKeyValuePair();

  const addKeyValuePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) {
      return;
    }

    if (!newKey || !newValue) {
      return;
    }

    try {
      await addMutation.mutateAsync({
        table: selectedTable,
        key: newKey,
        value: newValue,
      });
      // Clear form
      setNewKey('');
      setNewValue('');
    } catch (error) {
      console.error('Error adding key-value pair:', error);
    }
  };

  return (
    <>
      {!selectedTable && (
        <ErrorState
          title="No Table Selected"
          message="Please select a table first to add key-value pairs."
        />
      )}

      {addMutation.isError && (
        <ErrorState
          error={addMutation.error}
          message="Failed to add key-value pair. Please try again."
        />
      )}

      {addMutation.isSuccess && <SuccessState message="Key-value pair added successfully!" />}

      <form onSubmit={addKeyValuePair}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-5">
            <Input
              label="Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              required
              disabled={!selectedTable || addMutation.isLoading}
              placeholder="Enter key name"
            />
          </div>
          <div className="sm:col-span-5">
            <Input
              label="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              required
              disabled={!selectedTable || addMutation.isLoading}
              placeholder="Enter value"
              multiline
              rows={3}
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedTable || !newKey || !newValue || addMutation.isLoading}
              className="w-full h-10"
            >
              {addMutation.isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddKeyValueForm;
