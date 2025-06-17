import { Plus, Save, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

import { useAddKeyValuePair } from '@/hooks/useApi';
import { Alert, Button, Card, CardContent, CardHeader, Input, Textarea } from '@/ui';

interface KeyValueFormProps {
  selectedTable: string;
  initialKey?: string;
  initialValue?: string;
  isEdit?: boolean;
  onSuccess?: () => void;
}

const KeyValueForm: React.FC<KeyValueFormProps> = ({
  selectedTable,
  initialKey = '',
  initialValue = '',
  isEdit = false,
  onSuccess,
}) => {
  const [key, setKey] = useState<string>(initialKey);
  const [val, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const mutation = useAddKeyValuePair();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedTable || !key || !val) {
      return;
    }

    try {
      await mutation.mutateAsync({
        table: selectedTable,
        key,
        value: val,
      });

      setSuccess(true);

      if (!isEdit) {
        // If adding a new KV pair, clear the form
        setKey('');
        setValue('');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save key-value pair');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Value' : 'Enter Key-Value Details'}
          </h2>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert variant="success" className="mb-6">
              Key-value pair {isEdit ? 'updated' : 'added'} successfully!
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                disabled={isEdit || mutation.isLoading}
                fullWidth
                readOnly={isEdit}
                className="font-mono text-sm"
              />

              <Textarea
                label="Value"
                value={val}
                onChange={(e) => setValue(e.target.value)}
                required
                disabled={mutation.isLoading}
                fullWidth
                rows={8}
                className="font-mono text-sm resize-y"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!key || !val || mutation.isLoading}
              className="inline-flex items-center space-x-2"
            >
              {mutation.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEdit ? (
                <Save className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>
                {mutation.isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Key-Value Pair'}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyValueForm;
