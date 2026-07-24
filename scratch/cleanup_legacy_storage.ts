import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabaseAdmin';

const BUCKET_NAME = 'customer-documents';

async function auditBucket() {
  console.log('Auditing root of bucket:', BUCKET_NAME);
  const { data: rootItems, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list('', { limit: 100 });

  if (error) {
    console.error('List error:', error);
    return;
  }

  console.log('ROOT ITEMS FOUND:', rootItems);

  for (const item of rootItems || []) {
    if (item.name.includes('.')) {
      // It's a root file, remove it
      console.log('Removing root file:', item.name);
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([item.name]);
    } else {
      // It's a folder. Check if it's a legacy folder (not UUID and not draft_)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.name);
      const isDraft = item.name.startsWith('draft_');

      if (!isUuid && !isDraft) {
        console.log(`Cleaning legacy folder '${item.name}'...`);
        const { data: subFiles } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .list(item.name, { limit: 1000 });

        if (subFiles && subFiles.length > 0) {
          const filePaths = subFiles.map(f => `${item.name}/${f.name}`);
          console.log(`Deleting ${filePaths.length} files in '${item.name}'...`, filePaths);
          const { error: delErr } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .remove(filePaths);
          if (delErr) console.error('Delete error:', delErr);
          else console.log(`Deleted all files in '${item.name}'`);
        }
      }
    }
  }

  console.log('Audit and deep cleanup finished!');
}

auditBucket();
