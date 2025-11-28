import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface QRLink {
  id: number;
  title: string;
  url: string;
  description?: string;
  image_url?: string;
  order: number;
  auto_scroll_enabled?: boolean;
}

export function AdminPanel() {
  const [links, setLinks] = useState<QRLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', description: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initializeStorage();
    fetchLinks();
  }, []);

  async function initializeStorage() {
    try {
      // Try to list files in bucket to check if it exists
      const { error } = await supabase.storage
        .from('qr-images')
        .list();

      if (error && error.message.includes('not found')) {
        // Bucket doesn't exist, we'll handle the error on upload
        console.log('Bucket will be created on first upload');
      }
    } catch (error) {
      console.log('Storage check:', error);
    }
  }

  async function fetchLinks() {
    try {
      const { data, error } = await supabase
        .from('qr_links')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);

      // Get auto-scroll status from first link
      if (data && data.length > 0) {
        setAutoScrollEnabled(data[0].auto_scroll_enabled || false);
      }
    } catch (error) {
      toast.error('Failed to fetch links');
    } finally {
      setLoading(false);
    }
  }

  async function toggleAutoScroll(enabled: boolean) {
    try {
      if (links.length === 0) {
        toast.error('Add a link first');
        return;
      }

      // Update all links with the auto-scroll setting
      const { error } = await supabase
        .from('qr_links')
        .update({ auto_scroll_enabled: enabled })
        .in('id', links.map(l => l.id));

      if (error) throw error;

      setAutoScrollEnabled(enabled);
      toast.success(enabled ? 'Auto-scroll enabled' : 'Auto-scroll disabled');
      fetchLinks();
    } catch (error) {
      toast.error('Failed to update auto-scroll setting');
    }
  }
  async function changeOrder(id: number, direction: 'up' | 'down') {
    const currentIndex = links.findIndex(l => l.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const link = links[currentIndex];
    const targetLink = links[newIndex];

    try {
      const newOrder = direction === 'up' ? targetLink.order - 1 : targetLink.order + 1;
      const { error } = await supabase
        .from('qr_links')
        .update({ order: newOrder })
        .eq('id', id);

      if (error) throw error;
      fetchLinks();
      toast.success('Order updated');
    } catch (error) {
      toast.error('Failed to update order');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      toast.error('Title and URL are required');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('qr_links')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Link updated');
        setEditingId(null);
      } else {
        const maxOrderResult = await supabase
          .from('qr_links')
          .select('order')
          .order('order', { ascending: false })
          .limit(1);
        const nextOrder = maxOrderResult.data && maxOrderResult.data.length > 0 
          ? maxOrderResult.data[0].order + 1 
          : 0;

        const { error } = await supabase
          .from('qr_links')
          .insert([{ ...formData, order: nextOrder, auto_scroll_enabled: autoScrollEnabled }]);

        if (error) throw error;
        toast.success('Link created');
      }

      setFormData({ title: '', url: '', description: '', image_url: '' });
      fetchLinks();
    } catch (error) {
      toast.error('Failed to save link');
    }
  }

  async function deleteLink(id: number) {
    try {
      const { error } = await supabase
        .from('qr_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Link deleted');
      fetchLinks();
    } catch (error) {
      toast.error('Failed to delete link');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('qr-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('qr-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Make sure the bucket exists.');
    } finally {
      setUploading(false);
    }
  }

  function startEdit(link: QRLink) {
    setEditingId(link.id);
    setFormData({ 
      title: link.title, 
      url: link.url, 
      description: link.description || '',
      image_url: link.image_url || ''
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ title: '', url: '', description: '', image_url: '' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Scanner
          </Button>
        </div>

        {/* Auto-scroll toggle */}
        <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Auto-Scroll QR Codes</Label>
              <p className="text-sm text-muted-foreground mt-1">Automatically scroll to next QR code every 4 seconds</p>
            </div>
            <Switch
              checked={autoScrollEnabled}
              onCheckedChange={toggleAutoScroll}
              className="h-6 w-11"
            />
          </div>
        </Card>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            {editingId ? 'Edit Link' : 'Add New Link'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Link title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Description shown on QR code"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
              />
            </div>

            <div>
              <Label htmlFor="image">Image (optional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {formData.image_url && (
                <div className="mt-2">
                  <img src={formData.image_url} alt="Preview" className="h-20 rounded" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? 'Update Link' : 'Add Link'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">All Links ({links.length})</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : links.length === 0 ? (
            <p className="text-muted-foreground">No links created yet</p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <Card key={link.id} className="p-4">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{link.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                      {link.description && (
                        <p className="text-sm mt-1">{link.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => changeOrder(link.id, 'up')}
                        disabled={links.indexOf(link) === 0}
                        title="Move up"
                        className="w-8 h-8 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => changeOrder(link.id, 'down')}
                        disabled={links.indexOf(link) === links.length - 1}
                        title="Move down"
                        className="w-8 h-8 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(link)}
                        className="w-8 h-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteLink(link.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {link.image_url && (
                    <div className="flex gap-3 items-center">
                      <img src={link.image_url} alt={link.title} className="h-20 rounded" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}