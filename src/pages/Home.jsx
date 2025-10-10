import React, { useState, useEffect, useMemo } from 'react';

function Home() {
  const [verseOfTheDay, setVerseOfTheDay] = useState({
    reference: 'John 3:16',
    content: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    copyright: 'Loading...'
  });
  const [loading, setLoading] = useState(true);
  const [dailyDevotional, setDailyDevotional] = useState({
    prayer: '',
    scripture: { reference: '', content: '', copyright: '' }
  });

  // Array of daily devotionals with paired prayers and scriptures
  const dailyDevotionals = useMemo(() => [
    {
      prayer: "Lord, guide us in Your wisdom and help us to walk in Your ways. Grant us strength for today and hope for tomorrow.",
      scripture: { reference: "Proverbs 3:5-6", content: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", copyright: "NIV" }
    },
    {
      prayer: "Heavenly Father, we thank You for this new day. Fill our hearts with Your peace and our minds with Your truth. Help us to love others as You have loved us.",
      scripture: { reference: "John 13:34-35", content: "A new command I give you: Love one another. As I have loved you, so you must love one another. By this everyone will know that you are my disciples, if you love one another.", copyright: "NIV" }
    },
    {
      prayer: "Almighty God, grant us wisdom to make good choices, courage to face our challenges, and compassion to serve others in Your name.",
      scripture: { reference: "James 1:5", content: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.", copyright: "NIV" }
    },
    {
      prayer: "Dear Lord, help us to seek first Your kingdom and Your righteousness. May Your will be done in our lives today and always.",
      scripture: { reference: "Matthew 6:33", content: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", copyright: "NIV" }
    },
    {
      prayer: "Father in Heaven, we praise You for Your faithfulness. Guide our steps, guard our hearts, and use us for Your glory.",
      scripture: { reference: "Psalm 37:23", content: "The LORD makes firm the steps of the one who delights in him; though he may stumble, he will not fall, for the LORD upholds him with his hand.", copyright: "NIV" }
    },
    {
      prayer: "Lord Jesus, You are our light in the darkness. Help us to shine Your love to others and walk in Your truth throughout this day.",
      scripture: { reference: "John 8:12", content: "When Jesus spoke again to the people, he said, 'I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.'", copyright: "NIV" }
    },
    {
      prayer: "God of mercy and grace, forgive our sins and cleanse our hearts. Help us to forgive others as You have forgiven us.",
      scripture: { reference: "1 John 1:9", content: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.", copyright: "NIV" }
    },
    {
      prayer: "Loving Father, we commit this day to You. May every word we speak and every action we take bring honor to Your holy name.",
      scripture: { reference: "Colossians 3:17", content: "And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.", copyright: "NIV" }
    },
    {
      prayer: "Lord, You are our refuge and strength. In times of trouble, help us to trust in You and find peace in Your presence.",
      scripture: { reference: "Psalm 46:1", content: "God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea.", copyright: "NIV" }
    },
    {
      prayer: "Heavenly Father, thank You for Your countless blessings. Help us to be grateful hearts and generous hands to those in need.",
      scripture: { reference: "1 Thessalonians 5:18", content: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.", copyright: "NIV" }
    },
    {
      prayer: "Dear God, grant us patience in trials, joy in Your salvation, and perseverance in our faith journey.",
      scripture: { reference: "James 1:2-3", content: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.", copyright: "NIV" }
    },
    {
      prayer: "Lord of all creation, we marvel at Your works. Help us to be good stewards of all You have entrusted to us.",
      scripture: { reference: "Genesis 1:27", content: "So God created mankind in his own image, in the image of God he created them; male and female he created them.", copyright: "NIV" }
    },
    {
      prayer: "Gracious God, fill us with Your Holy Spirit. Guide us in righteousness and help us to bear fruit that glorifies You.",
      scripture: { reference: "Galatians 5:22-23", content: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.", copyright: "NIV" }
    },
    {
      prayer: "Father, You know our needs before we ask. We trust in Your provision and seek to be content in all circumstances.",
      scripture: { reference: "Philippians 4:19", content: "And my God will meet all your needs according to the riches of his glory in Christ Jesus.", copyright: "NIV" }
    },
    {
      prayer: "Lord Jesus, You are the way, the truth, and the life. Help us to follow You faithfully and share Your gospel with others.",
      scripture: { reference: "John 14:6", content: "Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me.'", copyright: "NIV" }
    },
    {
      prayer: "God of hope, when we feel discouraged, remind us of Your promises. Help us to encourage others with the hope we have in You.",
      scripture: { reference: "Romans 15:13", content: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.", copyright: "NIV" }
    },
    {
      prayer: "Mighty God, You are our protector and defender. Help us to find courage in You and to stand firm in our faith.",
      scripture: { reference: "Ephesians 6:10", content: "Finally, be strong in the Lord and in his mighty power. Put on the full armor of God, so that you can take your stand against the devil's schemes.", copyright: "NIV" }
    },
    {
      prayer: "Loving Savior, You have called us to be salt and light in this world. Help us to make a positive difference wherever we go.",
      scripture: { reference: "Matthew 5:14-16", content: "You are the light of the world. A town built on a hill cannot be hidden. Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", copyright: "NIV" }
    },
    {
      prayer: "Father of compassion, help us to show kindness to all people, especially those who are hurting or in need.",
      scripture: { reference: "Ephesians 4:32", content: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.", copyright: "NIV" }
    },
    {
      prayer: "Lord, as we end this week, we thank You for Your faithfulness. Prepare our hearts for worship and rest in You.",
      scripture: { reference: "Psalm 92:1-2", content: "It is good to praise the LORD and make music to your name, O Most High, proclaiming your love in the morning and your faithfulness at night.", copyright: "NIV" }
    },
    {
      prayer: "God of new beginnings, as we start a new week, help us to seek You first and trust in Your perfect plan for our lives.",
      scripture: { reference: "Jeremiah 29:11", content: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, to give you hope and a future.", copyright: "NIV" }
    },
    {
      prayer: "Heavenly Father, grant us wisdom to understand Your Word and strength to live it out in our daily lives.",
      scripture: { reference: "2 Timothy 3:16-17", content: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.", copyright: "NIV" }
    },
    {
      prayer: "Dear Lord, help us to be peacemakers in a troubled world, bringing Your love and reconciliation wherever we go.",
      scripture: { reference: "Matthew 5:9", content: "Blessed are the peacemakers, for they will be called children of God.", copyright: "NIV" }
    },
    {
      prayer: "God of all comfort, be near to those who are suffering today. Use us as instruments of Your healing and hope.",
      scripture: { reference: "2 Corinthians 1:3-4", content: "Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.", copyright: "NIV" }
    },
    {
      prayer: "Lord Jesus, help us to love You with all our heart, soul, mind, and strength, and to love our neighbors as ourselves.",
      scripture: { reference: "Mark 12:30-31", content: "Love the Lord your God with all your heart and with all your soul and with all your mind and with all your strength. The second is this: Love your neighbor as yourself.", copyright: "NIV" }
    },
    {
      prayer: "Father, we pray for unity among believers and for Your church to be a beacon of hope in this world.",
      scripture: { reference: "Ephesians 4:3", content: "Make every effort to keep the unity of the Spirit through the bond of peace. There is one body and one Spirit, just as you were called to one hope.", copyright: "NIV" }
    },
    {
      prayer: "Gracious God, help us to be humble in spirit, quick to listen, slow to speak, and slow to become angry.",
      scripture: { reference: "James 1:19", content: "My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry.", copyright: "NIV" }
    },
    {
      prayer: "Lord, grant us discernment to know Your will and courage to follow where You lead us.",
      scripture: { reference: "Proverbs 16:9", content: "In their hearts humans plan their course, but the LORD establishes their steps.", copyright: "NIV" }
    },
    {
      prayer: "Heavenly Father, help us to find rest in You when we are weary and to find strength in You when we are weak.",
      scripture: { reference: "Matthew 11:28-30", content: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart.", copyright: "NIV" }
    },
    {
      prayer: "Dear God, may Your peace, which surpasses all understanding, guard our hearts and minds in Christ Jesus.",
      scripture: { reference: "Philippians 4:6-7", content: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.", copyright: "NIV" }
    },
    {
      prayer: "Lord, help us to remember that You work all things together for good for those who love You and are called according to Your purpose.",
      scripture: { reference: "Romans 8:28", content: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", copyright: "NIV" }
    }
  ], []);

  useEffect(() => {
    // Get daily devotional based on current date
    const getDailyDevotional = () => {
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      return dailyDevotionals[dayOfYear % dailyDevotionals.length];
    };

    // Set the daily devotional (both prayer and scripture)
    const todaysDevotional = getDailyDevotional();
    setDailyDevotional(todaysDevotional);
    setVerseOfTheDay(todaysDevotional.scripture);
    setLoading(false);
  }, [dailyDevotionals]);

  return (
    <div className="page">
      <div className="hero">
        <div style={{fontSize: '4rem', marginBottom: '20px'}}>🕊️</div>
        <h1>🕊️ Welcome to Bible Website</h1>
        <p>Discover God's Word through daily scriptures, prayers, and spiritual guidance</p>
      </div>
      
      <div className="content-grid">
        <div className="card">
          <h3>📖 Scripture of the Day</h3>
          {loading ? (
            <p style={{color: '#666', fontStyle: 'italic'}}>Loading verse of the day...</p>
          ) : (
            <>
              <div 
                style={{
                  fontSize: '16px', 
                  lineHeight: '1.6', 
                  marginBottom: '15px',
                  fontStyle: 'italic',
                  color: '#2c3e50'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: verseOfTheDay.content.replace(/<[^>]*>/g, '') 
                }}
              />
              <span className="verse" style={{fontWeight: 'bold', color: '#3498db'}}>
                {verseOfTheDay.reference}
              </span>
            </>
          )}
          <p style={{
            fontSize: '12px',
            color: '#7f8c8d',
            marginTop: '15px',
            textAlign: 'center'
          }}>
            � This scripture is paired with today's prayer for a complete devotional
          </p>
        </div>
        
        <div className="card">
          <h3>🙏 Daily Prayer</h3>
          <p style={{
            fontStyle: 'italic',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#2c3e50'
          }}>
            {dailyDevotional.prayer}
          </p>
          <p style={{
            fontSize: '12px',
            color: '#7f8c8d',
            marginTop: '15px',
            textAlign: 'center'
          }}>
            🌅 This prayer and scripture pair change daily - a complete devotional experience
          </p>
        </div>
        
        <div className="card">
          <h3>⭐ Quick Actions</h3>
          <div className="action-buttons">
            <a href="/scripture-lookup" className="btn">Search Scripture</a>
            <a href="/bible-reading" className="btn">Bible Reading</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;