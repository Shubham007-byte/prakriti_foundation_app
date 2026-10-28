import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createEvent, createWork, saveSetting } from './actions';
import { logout } from '@/app/login/actions';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!user?.email || !allow.includes(user.email.toLowerCase())) redirect('/login');
  const [workResult, eventResult, settingResult] = await Promise.all([
    supabase.from('work_posts').select('id,title,published').order('created_at',{ascending:false}).limit(20),
    supabase.from('events').select('id,title,event_date,published').order('event_date',{ascending:true}).limit(20),
    supabase.from('site_settings').select('key,value')
  ]);
  const settings = Object.fromEntries((settingResult.data || []).map((x:any)=>[x.key,x.value]));
  const field = (key:string,label:string,placeholder='') => <form action={saveSetting} className="panel" encType="multipart/form-data"><input type="hidden" name="key" value={key}/><label>{label}</label>{key === 'donation_qr_url' && <><label>Upload verified QR image (JPG, PNG, WebP; max 5 MB)</label><input name="image" type="file" accept="image/jpeg,image/png,image/webp"/></>}<label>{key === 'donation_qr_url' ? 'Or QR image URL' : 'Value'}</label><input name="value" defaultValue={settings[key] || ''} placeholder={placeholder}/><button type="submit">Save {label.toLowerCase()}</button></form>;
  return <main className="wrap section"><div className="row"><div><div className="eyebrow">Team workspace</div><h1>Foundation admin</h1><p className="muted">Signed in as {user.email}</p></div><form action={logout}><button className="light" type="submit">Sign out</button></form></div>
    <p className="notice">Publish only approved content. Donation QR and UPI details are not enabled by default; enter them only after verifying the recipient account and foundation's eligibility.</p>
    <div className="admin-grid"><section className="panel"><h2>Add work post</h2><form action={createWork}><label>Title *</label><input name="title" required maxLength={140}/><label>Category</label><input name="category" placeholder="Community, Environment…"/><label>Description</label><textarea name="description" maxLength={2000}/><label>Activity date</label><input type="date" name="activity_date"/><label>Upload photo (JPG, PNG, WebP; max 8 MB)</label><input name="image" type="file" accept="image/jpeg,image/png,image/webp"/><label>Or image URL</label><input name="image_url" type="url" placeholder="Optional public image URL"/><label><input type="checkbox" name="published" style={{width:'auto',display:'inline'}}/> Publish on public website</label><button type="submit">Save work post</button></form><h3>Recent work posts</h3>{(workResult.data||[]).map((p:any)=><p key={p.id}>{p.title} — {p.published?'Published':'Draft'}</p>)}{workResult.error && <p className="small">Run the included database schema first.</p>}</section>
    <section className="panel"><h2>Add event</h2><form action={createEvent}><label>Event title *</label><input name="title" required maxLength={140}/><label>Description</label><textarea name="description" maxLength={2000}/><label>Date and time *</label><input name="event_date" type="datetime-local" required/><label>Location</label><input name="location"/><label>Registration URL</label><input name="registration_url" type="url"/><label><input type="checkbox" name="published" style={{width:'auto',display:'inline'}}/> Publish on public website</label><button type="submit">Save event</button></form><h3>Events</h3>{(eventResult.data||[]).map((e:any)=><p key={e.id}>{e.title} — {new Date(e.event_date).toLocaleDateString('en-IN')} — {e.published?'Published':'Draft'}</p>)}{eventResult.error && <p className="small">Run the included database schema first.</p>}</section></div>
    <section className="section"><div className="eyebrow">Website settings</div><h2>Contact and donation settings</h2><p className="muted">Use only details approved by the foundation. A QR image URL must point to the verified foundation QR.</p><div className="admin-grid">{field('mission','Mission statement','Approved mission statement')}{field('instagram_url','Instagram profile URL','https://www.instagram.com/...')}{field('contact_email','Contact email','official email')}{field('contact_phone','Contact phone','official phone')}{field('donation_qr_url','Verified donation QR image URL','https://...')}{field('upi_id','Verified UPI ID','foundation@upi')}</div></section>
    <p className="small">Initial version: adding posts/events and editing settings is supported. Editing/deleting existing entries, direct file upload, team invitation UI, audit logs and payment gateway are planned follow-up work.</p>
  </main>;
}
