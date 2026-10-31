import {getCliClient} from 'sanity/cli';
import {readFile} from 'node:fs/promises';
const client=getCliClient({apiVersion:'2026-10-28'}).withConfig({useCdn:false});
const id='drafts.integration-check-'+Date.now();
try {
  const asset=await client.assets.upload('image',await readFile('../images/logo-eletrotech-sem-residuos.png'),{filename:'eletrotech-logo.png'});
  await client.create({_id:id,_type:'product',name:'Integration verification',active:false,image:{_type:'image',asset:{_type:'reference',_ref:asset._id}}});
  await client.patch(id).set({name:'Verified upload and editing'}).commit();
  const result=await client.fetch('*[_id==$id][0]{name,"url":image.asset->url}',{id},{perspective:'raw'});
  if(result?.name!=='Verified upload and editing'||!result.url)throw Error('Draft read/write verification failed');
  const response=await fetch(result.url);
  if(!response.ok||(await response.arrayBuffer()).byteLength===0)throw Error('Uploaded image unavailable');
  console.log('Verified: authenticated creation, editing, image upload and CDN download.');
} finally {
  await client.delete(id);
  console.log('Temporary verification document removed.');
}
