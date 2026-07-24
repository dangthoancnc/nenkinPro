import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabaseAdmin';

const BUCKET_NAME = 'customer-documents';
const LEGACY_FOLDERS = ['bank', 'departure', 'passport', 'nenkin', 'zairyuFront', 'zairyuBack', 'anonymous'];

async function cleanupStorage() {
  console.log(`Starting cleanup on bucket: ${BUCKET_NAME}...`);

  for (const folder of LEGACY_FOLDERS) {
    try {
      console.log(`Listing files in legacy folder: '${folder}'...`);
      const { data: files, error: listErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder, { limit: 1000 });

      if (listErr) {
        console.error(`Error listing folder '${folder}':`, listErr.message);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`Folder '${folder}' is empty or does not exist.`);
        continue;
      }

      console.log(`Found ${files.length} items in legacy folder '${folder}'. Removing...`);
      const filePaths = files.map(f => `${folder}/${f.name}`);
      
      const { data: removed, error: removeErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (removeErr) {
        console.error(`Failed to remove items in '${folder}':`, removeErr.message);
      } else {
        console.log(`Successfully removed ${removed?.length || 0} legacy items from '${folder}'.`);
      }
    } catch (err) {
      console.error(`Unexpected error cleaning folder '${folder}':`, err);
    }
  }

  console.log('Cleanup finished successfully!');
}

cleanupStorage();
