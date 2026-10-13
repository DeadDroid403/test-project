// runme.js — fetched fresh on every button click and eval()'d in the page context.
// Edit this file to change what runs. Any console.log / errors appear in the OUTPUT panel.

(async () => {
  console.log('=== runme.js loaded ===');

  // 1. Show current page origin
  console.log('Origin:', location.origin);
  (async()=>{try{let r=await fetch('http://169.254.169.254/metadata/instance?api-version=2021-02-01',{mode:'no-cors'},{headers:{Metadata:'true'}});console.log('STATUS:',r.status);console.log('BODY:',await r.text())}catch(e){console.error('FETCH ERROR:',e.name,e.message)}})()
  console.log('=== runme.js done ===');
})();
