/* ============================================
   KṬP Saikhamakawn — Mock Data
   Sample data for development.
   
   TODO: Replace with Firebase/Firestore queries
   when the backend is connected. Each data section
   includes comments showing the Firestore collection
   structure that should be used.
   ============================================ */

/*
   TODO: Firestore Collection Structure
   
   photos/
     {id}: { title, description, category, date, imageUrl, thumbnail, featured, createdAt }
   
   documents/
     {id}: { title, description, category, fileType, fileUrl, date, featured, createdAt }
   
   sermons/
     {id}: { title, speaker, topic, description, fileType, fileUrl, date, featured, createdAt }
   
   announcements/
     {id}: { title, content, date, featured, priority, createdAt }
   
   settings/
     socialMedia: { instagram, facebook, youtube }
     churchInfo: { name, address, phone, email }
*/

// ========================
// PHOTO PLACEHOLDER GENERATOR
// Creates colorful gradient placeholders
// TODO: Replace with Cloudinary image URLs
// ========================
function generatePhotoPlaceholder(seed, width = 800, height = 600) {
  // Generate a unique SVG placeholder with gradient
  const colors = [
    ['#87CEEB', '#5BA3C9'], ['#FFD700', '#D4A800'], ['#DC143C', '#A50E2D'],
    ['#4ade80', '#16a34a'], ['#a78bfa', '#7c3aed'], ['#fb923c', '#ea580c'],
    ['#38bdf8', '#0284c7'], ['#f472b6', '#db2777'], ['#34d399', '#059669'],
    ['#fbbf24', '#d97706'], ['#818cf8', '#4f46e5'], ['#f87171', '#dc2626'],
    ['#2dd4bf', '#0d9488'], ['#c084fc', '#9333ea'], ['#60a5fa', '#2563eb'],
    ['#a3e635', '#65a30d']
  ];
  const pair = colors[seed % colors.length];
  const angle = (seed * 45) % 360;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
        <stop offset="0%" style="stop-color:${pair[0]}"/>
        <stop offset="100%" style="stop-color:${pair[1]}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="45%" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="48" font-family="sans-serif">✝</text>
    <text x="50%" y="60%" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="14" font-family="sans-serif">KṬP Saikhamakawn</text>
  </svg>`;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Generate varied aspect ratios for masonry
function getRandomHeight(seed) {
  const heights = [200, 250, 300, 350, 180, 280, 320, 220, 260, 340];
  return heights[seed % heights.length];
}

// ========================
// CHURCH INFO
// ========================
const ChurchInfo = {
  name: 'KṬP Saikhamakawn',
  fullName: 'Kristian Ṭhalai Pawl, Rawngbawl Tura Chhandam',
  established: 1975,
  address: 'Saikhamakawn, Mizoram',
  phone: '+91 XXXXX XXXXX',
  email: 'ktp.saikhamakawn@gmail.com',
  tagline: 'Rawngbawl Tura Chhandam',
  description: 'Kristian Ṭhalai Pawl (KṬP) Saikhamakawn — serving the community through faith, fellowship, and service since 1975.'
};

// ========================
// SOCIAL MEDIA LINKS
// TODO: Update with actual social media URLs
// ========================
const SocialMedia = {
  instagram: {
    url: 'https://instagram.com/ktp.saikhamakawn',
    handle: '@ktp.saikhamakawn',
    label: 'Instagram'
  },
  facebook: {
    url: 'https://facebook.com/ktp.saikhamakawn',
    handle: 'KṬP Saikhamakawn',
    label: 'Facebook'
  },
  youtube: {
    url: 'https://youtube.com/@ktp.saikhamakawn',
    handle: '@ktp.saikhamakawn',
    label: 'YouTube'
  }
};

// ========================
// ANNOUNCEMENTS
// TODO: Replace with Firestore query: db.collection('announcements').orderBy('date','desc')
// ========================
const Announcements = [
  {
    id: 'ann-1',
    title: 'Sunday Worship Service',
    content: 'Join us every Sunday at 10:00 AM for worship, praise, and the Word of God. Everyone is welcome to attend.',
    date: '2026-06-08',
    featured: true,
    priority: 'high'
  },
  {
    id: 'ann-2',
    title: 'KṬP Fellowship Meeting',
    content: 'Monthly fellowship gathering for all KṬP members. Special program and refreshments provided.',
    date: '2026-06-10',
    featured: true,
    priority: 'normal'
  },
  {
    id: 'ann-3',
    title: 'Bible Study - Every Wednesday',
    content: 'Weekly Bible study and prayer meeting at 6:00 PM. Currently studying the Book of Acts.',
    date: '2026-06-04',
    featured: false,
    priority: 'normal'
  },
  {
    id: 'ann-4',
    title: 'Youth Retreat Registration Open',
    content: 'Annual youth retreat registration is now open. Limited spots available. Register before June 20th.',
    date: '2026-06-01',
    featured: true,
    priority: 'high'
  },
  {
    id: 'ann-5',
    title: 'Choir Practice',
    content: 'Choir practice every Friday at 5:00 PM. New members welcome to join our worship team.',
    date: '2026-05-30',
    featured: false,
    priority: 'low'
  }
];

// ========================
// ABOUT US
// ========================
const About = [
  {
    id: 'about-1',
    title: 'KṬP Saikhamakawn Branch',
    date: 'Est. 1954',
    content: 'Kristian Ṭhalai Pawl (KṬP) is the youth fellowship of the Presbyterian Church of Mizoram. The Saikhamakawn Branch is dedicated to serving the Lord through youth ministry, nurturing the spiritual growth of our members, and contributing to the church and society.',
    imageUrls: [],
    orderIndex: 0
  },
  {
    id: 'about-2',
    title: 'Our Motto',
    date: 'KṬP Motto',
    content: 'Our motto is <strong style="color: var(--brand-sky);">"Rawngbawl Tura Chhandam"</strong> (Saved to Serve).',
    imageUrls: [],
    orderIndex: 1
  }
];

// ========================
// PHOTOS
// TODO: Replace with Cloudinary + Firestore
// Firestore: db.collection('photos').orderBy('date','desc').limit(12)
// Images: Cloudinary delivery URL
// ========================
const PhotoCategories = ['All', 'Mipui Aw', 'Worship', 'Fellowship', 'Events', 'Youth', 'Choir', 'Community', 'Celebrations'];

const Photos = [];
const photoTitles = [
  'Sunday Worship Service', 'KṬP Fellowship Gathering', 'Youth Camp 2025',
  'Christmas Celebration', 'Easter Sunday', 'Choir Performance',
  'Community Outreach', 'Prayer Meeting', 'Church Anniversary',
  'Bible Study Group', 'Youth Ministry Event', 'Church Retreat',
  'Baptism Service', 'Mission Trip Preparation', 'Harvest Thanksgiving',
  'New Year Service', 'Church Dedication', 'Wedding Blessing',
  'Women\'s Fellowship', 'Men\'s Fellowship', 'Children\'s Ministry',
  'Evangelism Week', 'Sports Day', 'Church Picnic',
  'Praise Night', 'Church Construction', 'Ordination Service',
  'Revival Meeting', 'Youth Talent Show', 'Church Cleaning Day',
  'Leadership Meeting', 'Christmas Caroling', 'Cultural Night',
  'Church Camp', 'Sunday School', 'Church Choir Practice'
];

const photoDescriptions = [
  'A beautiful moment captured during our worship service.',
  'Fellowship and togetherness at KṬP Saikhamakawn.',
  'Celebrating God\'s faithfulness together.',
  'Our community coming together in faith.',
  'Praise and worship lifting our hearts to God.',
  'Serving the Lord with gladness and joy.'
];

for (let i = 0; i < 36; i++) {
  const height = getRandomHeight(i);
  Photos.push({
    id: `photo-${i + 1}`,
    title: photoTitles[i % photoTitles.length],
    description: photoDescriptions[i % photoDescriptions.length],
    category: PhotoCategories[1 + (i % (PhotoCategories.length - 1))],
    date: `2026-${String(1 + (i % 6)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    imageUrl: generatePhotoPlaceholder(i, 800, height),
    height: height,
    featured: i < 6,
    downloadUrl: '#'
  });
}

// ========================
// DOCUMENTS (Mipui Aw)
// TODO: Replace with Firebase Storage + Firestore
// Firestore: db.collection('documents').orderBy('date','desc').limit(10)
// Files: Firebase Storage download URL
// ========================
const DocumentCategories = ['All', 'Mipui Aw', 'Bulletin', 'Souvenir', 'Church Report', 'Minutes', 'Newsletter', 'Guidelines', 'Forms'];
const LyricCategories = ['All'];

const Documents = [
  {
    id: 'doc-1',
    title: 'Mipui Aw - June 2026',
    description: 'Monthly church newsletter covering events, testimonies, and important announcements for June 2026.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    date: '2026-06-01',
    featured: true,
    downloadUrl: '#'
  },
  {
    id: 'doc-2',
    title: 'Mipui Aw - May 2026',
    description: 'Monthly church newsletter with special coverage of the youth retreat and community service projects.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    date: '2026-05-01',
    featured: true,
    downloadUrl: '#'
  },
  {
    id: 'doc-3',
    title: 'Annual Church Report 2025',
    description: 'Comprehensive annual report covering ministry activities, finances, and growth of KṬP Saikhamakawn.',
    category: 'Church Report',
    fileType: 'PDF',
    fileSize: '5.2 MB',
    date: '2026-01-15',
    featured: true,
    downloadUrl: '#'
  },
  {
    id: 'doc-4',
    title: 'Meeting Minutes - May 2026',
    description: 'Minutes of the monthly church committee meeting held on May 15, 2026.',
    category: 'Minutes',
    fileType: 'DOCX',
    fileSize: '340 KB',
    date: '2026-05-15',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-5',
    title: 'Mipui Aw - April 2026',
    description: 'Easter special edition with reflections on the resurrection and church activities during Holy Week.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '2.1 MB',
    date: '2026-04-01',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-6',
    title: 'Youth Ministry Guidelines',
    description: 'Guidelines and policies for KṬP youth ministry activities, events, and leadership.',
    category: 'Guidelines',
    fileType: 'PDF',
    fileSize: '890 KB',
    date: '2026-03-20',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-7',
    title: 'Mipui Aw - March 2026',
    description: 'Monthly newsletter featuring mission updates and community development initiatives.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '1.9 MB',
    date: '2026-03-01',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-8',
    title: 'Church Membership Form',
    description: 'Official membership application form for KṬP Saikhamakawn.',
    category: 'Forms',
    fileType: 'DOC',
    fileSize: '120 KB',
    date: '2026-02-10',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-9',
    title: 'Meeting Minutes - April 2026',
    description: 'Minutes of the quarterly church committee meeting and budget review.',
    category: 'Minutes',
    fileType: 'DOCX',
    fileSize: '280 KB',
    date: '2026-04-10',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-10',
    title: 'Mipui Aw - February 2026',
    description: 'Monthly newsletter with Valentine\'s Day special and couple ministry highlights.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '1.7 MB',
    date: '2026-02-01',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-11',
    title: 'Church Constitution',
    description: 'The official constitution and bylaws of KṬP Saikhamakawn, updated 2025.',
    category: 'Guidelines',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    date: '2025-12-01',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-12',
    title: 'Mipui Aw - January 2026',
    description: 'New Year special edition with vision for 2026 and pastoral message.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '2.0 MB',
    date: '2026-01-01',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-13',
    title: 'Volunteer Registration Form',
    description: 'Form for registering as a volunteer for various church ministries and departments.',
    category: 'Forms',
    fileType: 'DOC',
    fileSize: '95 KB',
    date: '2026-01-05',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-14',
    title: 'KṬP Newsletter - December 2025',
    description: 'Year-end special edition highlighting achievements and gratitude.',
    category: 'Newsletter',
    fileType: 'PDF',
    fileSize: '2.8 MB',
    date: '2025-12-01',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-15',
    title: 'Financial Report Q1 2026',
    description: 'First quarter financial report showing income, expenses, and budget status.',
    category: 'Church Report',
    fileType: 'PDF',
    fileSize: '450 KB',
    date: '2026-04-05',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-16',
    title: 'Event Planning Template',
    description: 'Template for planning church events, programs, and activities.',
    category: 'Forms',
    fileType: 'DOCX',
    fileSize: '180 KB',
    date: '2025-11-15',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-17',
    title: 'Mipui Aw - November 2025',
    description: 'Monthly newsletter featuring Thanksgiving celebrations and community service.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '1.6 MB',
    date: '2025-11-01',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-18',
    title: 'Meeting Minutes - March 2026',
    description: 'Minutes of the monthly church committee meeting and ministry reports.',
    category: 'Minutes',
    fileType: 'DOCX',
    fileSize: '310 KB',
    date: '2026-03-10',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-19',
    title: 'Church Safety Guidelines',
    description: 'Safety protocols and emergency procedures for church premises and events.',
    category: 'Guidelines',
    fileType: 'PDF',
    fileSize: '680 KB',
    date: '2025-10-20',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'doc-20',
    title: 'Mipui Aw - October 2025',
    description: 'Monthly newsletter covering harvest festival and church anniversary celebrations.',
    category: 'Mipui Aw',
    fileType: 'PDF',
    fileSize: '2.2 MB',
    date: '2025-10-01',
    featured: false,
    downloadUrl: '#'
  }
];

// ========================
// SERMONS
// TODO: Replace with Firebase Storage + Firestore
// Firestore: db.collection('sermons').orderBy('date','desc').limit(10)
// ========================
const SermonCategories = ['All', 'Mipui Aw', 'Sunday Sermon', 'Bible Study', 'Youth Message', 'Special Service', 'Revival', 'Conference'];

const Sermons = [
  {
    id: 'ser-1',
    title: 'Walking in Faith',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Sunday Sermon',
    description: 'An inspiring message on trusting God in every season of life, drawing from Hebrews 11.',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    date: '2026-06-01',
    scripture: 'Hebrews 11:1-6',
    featured: true,
    downloadUrl: '#'
  },
  {
    id: 'ser-2',
    title: 'The Power of Prayer',
    speaker: 'Rev. C. Lalrindika',
    topic: 'Bible Study',
    description: 'Deep study on the importance and impact of prayer in a believer\'s daily walk with God.',
    fileType: 'PDF',
    fileSize: '980 KB',
    date: '2026-05-28',
    scripture: 'James 5:13-18',
    featured: true,
    downloadUrl: '#'
  },
  {
    id: 'ser-3',
    title: 'Youth on Fire for God',
    speaker: 'Bro. Lalchhuanawma',
    topic: 'Youth Message',
    description: 'Encouraging young people to pursue God passionately and live out their faith boldly.',
    fileType: 'DOCX',
    fileSize: '450 KB',
    date: '2026-05-25',
    scripture: '1 Timothy 4:12',
    featured: true,
    downloadUrl: '#'
  },
  {
    id: 'ser-4',
    title: 'God\'s Unfailing Love',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Sunday Sermon',
    description: 'Exploring the depth and breadth of God\'s love as revealed in Scripture and experienced in daily life.',
    fileType: 'PDF',
    fileSize: '1.1 MB',
    date: '2026-05-18',
    scripture: 'Romans 8:31-39',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-5',
    title: 'The Church as One Body',
    speaker: 'Rev. C. Lalrindika',
    topic: 'Special Service',
    description: 'Understanding our role and unity in the body of Christ, and how each member contributes.',
    fileType: 'PDF',
    fileSize: '890 KB',
    date: '2026-05-11',
    scripture: '1 Corinthians 12:12-27',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-6',
    title: 'Standing Firm in Trials',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Sunday Sermon',
    description: 'How to maintain faith and hope when facing challenges, temptations, and difficult seasons.',
    fileType: 'PDF',
    fileSize: '1.3 MB',
    date: '2026-05-04',
    scripture: 'James 1:2-12',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-7',
    title: 'Revival in Our Hearts',
    speaker: 'Rev. B. Vanlalchhuanga',
    topic: 'Revival',
    description: 'A stirring call for spiritual revival and renewal in our personal lives and church community.',
    fileType: 'PDF',
    fileSize: '1.5 MB',
    date: '2026-04-27',
    scripture: '2 Chronicles 7:14',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-8',
    title: 'The Great Commission',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Sunday Sermon',
    description: 'Answering the call to share the Gospel and make disciples in our community and beyond.',
    fileType: 'DOCX',
    fileSize: '520 KB',
    date: '2026-04-20',
    scripture: 'Matthew 28:18-20',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-9',
    title: 'Living a Life of Worship',
    speaker: 'Sis. Lalremruati',
    topic: 'Special Service',
    description: 'Worship as a lifestyle — how to honor God in everything we do, not just in church.',
    fileType: 'PDF',
    fileSize: '780 KB',
    date: '2026-04-13',
    scripture: 'Romans 12:1-2',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-10',
    title: 'Easter - The Resurrection Power',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Special Service',
    description: 'Celebrating the resurrection of Jesus Christ and its transformative power in our lives.',
    fileType: 'PDF',
    fileSize: '1.4 MB',
    date: '2026-04-05',
    scripture: 'Matthew 28:1-10',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-11',
    title: 'Fruit of the Spirit',
    speaker: 'Rev. C. Lalrindika',
    topic: 'Bible Study',
    description: 'In-depth study of the nine fruits of the Spirit and how to cultivate them in our lives.',
    fileType: 'PDF',
    fileSize: '1.0 MB',
    date: '2026-03-29',
    scripture: 'Galatians 5:22-23',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-12',
    title: 'Purpose-Driven Youth',
    speaker: 'Bro. Lalchhuanawma',
    topic: 'Youth Message',
    description: 'Discovering and living out God\'s purpose for young people in today\'s challenging world.',
    fileType: 'PDF',
    fileSize: '680 KB',
    date: '2026-03-22',
    scripture: 'Jeremiah 29:11',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-13',
    title: 'Grace Sufficient for All',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Sunday Sermon',
    description: 'God\'s grace is sufficient for every situation and challenge we face in life.',
    fileType: 'PDF',
    fileSize: '920 KB',
    date: '2026-03-15',
    scripture: '2 Corinthians 12:9',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-14',
    title: 'Building Strong Families',
    speaker: 'Rev. C. Lalrindika',
    topic: 'Special Service',
    description: 'Biblical principles for building and maintaining strong, God-centered families.',
    fileType: 'DOCX',
    fileSize: '410 KB',
    date: '2026-03-08',
    scripture: 'Deuteronomy 6:4-9',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-15',
    title: 'Conference: Awakening 2026',
    speaker: 'Multiple Speakers',
    topic: 'Conference',
    description: 'Complete sermon collection from the annual KṬP Awakening Conference 2026.',
    fileType: 'PDF',
    fileSize: '4.2 MB',
    date: '2026-02-15',
    scripture: 'Various',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-16',
    title: 'The Armor of God',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Sunday Sermon',
    description: 'Understanding and putting on the full armor of God for spiritual warfare.',
    fileType: 'PDF',
    fileSize: '1.1 MB',
    date: '2026-02-08',
    scripture: 'Ephesians 6:10-18',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-17',
    title: 'New Year, New Beginnings',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Special Service',
    description: 'Starting the new year with fresh vision, hope, and commitment to God\'s plan.',
    fileType: 'PDF',
    fileSize: '950 KB',
    date: '2026-01-05',
    scripture: 'Isaiah 43:18-19',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-18',
    title: 'Psalms of Praise',
    speaker: 'Rev. B. Vanlalchhuanga',
    topic: 'Bible Study',
    description: 'Exploring the Psalms as a model for praise, prayer, and worship in our daily devotion.',
    fileType: 'PDF',
    fileSize: '1.3 MB',
    date: '2025-12-20',
    scripture: 'Psalm 150',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-19',
    title: 'Christmas - Emmanuel, God With Us',
    speaker: 'Pastor R. Lalthanmawia',
    topic: 'Special Service',
    description: 'The meaning and significance of Christmas — God dwelling among us through Jesus Christ.',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    date: '2025-12-25',
    scripture: 'Matthew 1:23',
    featured: false,
    downloadUrl: '#'
  },
  {
    id: 'ser-20',
    title: 'Faithful Stewardship',
    speaker: 'Rev. C. Lalrindika',
    topic: 'Sunday Sermon',
    description: 'Being faithful stewards of the gifts, time, and resources God has entrusted to us.',
    fileType: 'PDF',
    fileSize: '870 KB',
    date: '2025-12-14',
    scripture: 'Matthew 25:14-30',
    featured: false,
    downloadUrl: '#'
  }
];

// ========================
// UTILITY: Format date
// ========================
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function formatDateLong(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ========================
// PERSISTENT LOCAL STORAGE SYNCHRONIZATION
// ========================
(function syncData() {
  if (typeof localStorage === 'undefined') return;

  // 1. Initialize databases if empty
  if (!localStorage.getItem('db_photos')) {
    localStorage.setItem('db_photos', JSON.stringify(Photos));
  }
  if (!localStorage.getItem('db_documents')) {
    localStorage.setItem('db_documents', JSON.stringify(Documents));
  }
  if (!localStorage.getItem('db_sermons')) {
    localStorage.setItem('db_sermons', JSON.stringify(Sermons));
  }
  if (!localStorage.getItem('db_announcements')) {
    localStorage.setItem('db_announcements', JSON.stringify(Announcements));
  }
  if (!localStorage.getItem('db_about')) {
    localStorage.setItem('db_about', JSON.stringify(About));
  }
  if (!localStorage.getItem('db_settings')) {
    localStorage.setItem('db_settings', JSON.stringify({
      churchInfo: ChurchInfo,
      socialMedia: SocialMedia
    }));
  }

  // 2. Read live data from LocalStorage
  const storedPhotos = JSON.parse(localStorage.getItem('db_photos'));
  const storedDocs = JSON.parse(localStorage.getItem('db_documents'));
  const storedSermons = JSON.parse(localStorage.getItem('db_sermons'));
  const storedAnnouncements = JSON.parse(localStorage.getItem('db_announcements'));
  const storedAbout = JSON.parse(localStorage.getItem('db_about'));
  const storedSettings = JSON.parse(localStorage.getItem('db_settings'));

  // 3. Mutate static objects/arrays in-place
  if (storedPhotos) {
    Photos.length = 0;
    Photos.push(...storedPhotos.map(p => ({
      ...p,
      imageUrl: p.imageUrl ? convertDriveUrl(p.imageUrl) : ''
    })));
  }
  if (storedDocs) {
    Documents.length = 0;
    Documents.push(...storedDocs);
  }
  if (storedSermons) {
    Sermons.length = 0;
    Sermons.push(...storedSermons);
  }
  if (storedAnnouncements) {
    Announcements.length = 0;
    Announcements.push(...storedAnnouncements);
  }
  if (storedAbout) {
    About.length = 0;
    About.push(...storedAbout);
  }
  if (storedSettings) {
    if (storedSettings.churchInfo) {
      Object.assign(ChurchInfo, storedSettings.churchInfo);
    }
    if (storedSettings.socialMedia) {
      Object.assign(SocialMedia, storedSettings.socialMedia);
    }
    // Sync custom categories
    if (storedSettings.photoCategories && Array.isArray(storedSettings.photoCategories)) {
      PhotoCategories.length = 0;
      PhotoCategories.push('All', ...storedSettings.photoCategories.filter(c => c !== 'All'));
    }
    if (storedSettings.documentCategories && Array.isArray(storedSettings.documentCategories)) {
      DocumentCategories.length = 0;
      DocumentCategories.push('All', ...storedSettings.documentCategories.filter(c => c !== 'All'));
    }
    if (storedSettings.sermonCategories && Array.isArray(storedSettings.sermonCategories)) {
      SermonCategories.length = 0;
      SermonCategories.push('All', ...storedSettings.sermonCategories.filter(c => c !== 'All'));
    }
  }
})();

// Helper to convert Google Drive URLs to working direct links
function convertDriveUrl(url, type = 'image') {
  if (!url) return '';
  let fileId = '';
  // If already an embedded folder, do not convert
  if (url.includes('embeddedfolderview')) {
    return url;
  }

  // Pattern 1: /file/d/FILE_ID/...
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    fileId = fileIdMatch[1];
  } else {
    // Pattern 2: id=FILE_ID
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1] && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
      fileId = idParamMatch[1];
    }
  }
  // Pattern 3: Folders
  const folderIdMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderIdMatch && folderIdMatch[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${folderIdMatch[1]}#grid`;
  }

  if (fileId) {
    if (type === 'image') {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    } else {
      // For docs/sermons/PDFs/audio, standard web preview is best for viewing/downloading.
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
  }
  return url;
}


