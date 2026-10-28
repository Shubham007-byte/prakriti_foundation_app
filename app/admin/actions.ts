'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function authorizedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!user?.email || !allow.includes(user.email.toLowerCase())) redirect('/login?error=not_allowed');
  return supabase;
}
export async function createWork(formData: FormData) {
  const supabase = await authorizedClient();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'Community').trim();
  const activityDate = String(formData.get('activity_date') || '');
  let imageUrl = String(formData.get('image_url') || '').trim();
  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    if (!['image/jpeg','image/png','image/webp'].includes(image.type) || image.size > 8 * 1024 * 1024) throw new Error('Use a JPG, PNG, or WebP image up to 8 MB.');
    const path = `work/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from('foundation-media').upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) throw new Error('Image upload failed. Check the storage bucket and admin permissions.');
    imageUrl = supabase.storage.from('foundation-media').getPublicUrl(path).data.publicUrl;
  }
  const published = formData.get('published') === 'on';
  if (!title) throw new Error('Title is required.');
  const { error } = await supabase.from('work_posts').insert({title, description, category, activity_date: activityDate || null, image_url: imageUrl || null, published});
  if (error) throw new Error('Could not save work post. Check database setup and permissions.');
  revalidatePath('/'); revalidatePath('/admin');
}
export async function createEvent(formData: FormData) {
  const supabase = await authorizedClient();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const date = String(formData.get('event_date') || '');
  const location = String(formData.get('location') || '').trim();
  const registrationUrl = String(formData.get('registration_url') || '').trim();
  const published = formData.get('published') === 'on';
  if (!title || !date) throw new Error('Event title and date are required.');
  const { error } = await supabase.from('events').insert({title, description, event_date: date, location, registration_url: registrationUrl || null, published});
  if (error) throw new Error('Could not save event. Check database setup and permissions.');
  revalidatePath('/'); revalidatePath('/admin');
}
export async function saveSetting(formData: FormData) {
  const supabase = await authorizedClient();
  const key = String(formData.get('key') || '');
  let value = String(formData.get('value') || '').trim();
  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    if (key !== 'donation_qr_url') throw new Error('File upload is only supported for the donation QR setting.');
    if (!['image/jpeg','image/png','image/webp'].includes(image.type) || image.size > 5 * 1024 * 1024) throw new Error('Use a JPG, PNG, or WebP image up to 5 MB.');
    const path = `donations/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from('foundation-media').upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) throw new Error('QR upload failed. Check storage bucket and admin permissions.');
    value = supabase.storage.from('foundation-media').getPublicUrl(path).data.publicUrl;
  }
  const allowed = ['mission','instagram_url','contact_email','contact_phone','donation_qr_url','upi_id'];
  if (!allowed.includes(key)) throw new Error('Unsupported setting.');
  // Payment-related settings stay empty until a team admin supplies verified details.
  const { error } = await supabase.from('site_settings').upsert({key, value, updated_at: new Date().toISOString()}, {onConflict:'key'});
  if (error) throw new Error('Could not save setting. Check database setup and permissions.');
  revalidatePath('/'); revalidatePath('/admin');
}
