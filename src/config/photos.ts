// iCloud Shared Album Configuration
// To use your own photos:
// 1. Export photos from your iCloud shared album
// 2. Upload them to a public hosting service (Cloudinary, AWS S3, etc.)
// 3. Add the URLs to the array below

export const FAMILY_PHOTOS = [
  // Add your photo URLs here, for example:
  // 'https://your-photo-host.com/photo1.jpg',
  // 'https://your-photo-host.com/photo2.jpg',
  
  // Temporary placeholder photos (remove these when you add real ones)
  'https://picsum.photos/1920/1080?random=1',
  'https://picsum.photos/1080/1920?random=2', 
  'https://picsum.photos/1920/1080?random=3',
  'https://picsum.photos/1080/1920?random=4',
  'https://picsum.photos/1920/1080?random=5',
  'https://picsum.photos/1080/1920?random=6',
  'https://picsum.photos/1920/1080?random=7',
  'https://picsum.photos/1080/1920?random=8',
  'https://picsum.photos/1920/1080?random=9',
  'https://picsum.photos/1080/1920?random=10',
]

// Alternative: If you want to keep using iCloud shared albums,
// you'll need to implement a server-side solution that can:
// 1. Parse the iCloud shared album URL
// 2. Authenticate with iCloud (requires Apple ID credentials)
// 3. Fetch the photos via Apple's private API
// 
// This is complex and not recommended for production use.
// Better to export your photos to a proper hosting service.