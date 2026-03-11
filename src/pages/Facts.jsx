import React, { useState, useEffect } from 'react';

// 1. DATA SOURCE: This can be as large as you want. 
// The rotation logic will handle any number of items.
const BIBLE_DATA = {
  records: [
    { title: "Longest Chapter", content: "Psalm 119", description: "176 verses about the beauty of God's Word.", reference: "Psalm 119" },
    { title: "Shortest Chapter", content: "Psalm 117", description: "Only two verses long; the center of the Bible.", reference: "Psalm 117" },
    { title: "Oldest Man", content: "Methuselah", description: "Lived to be 969 years old.", reference: "Genesis 5:27" },
    { title: "Longest Book", content: "Psalms", description: "A collection of 150 songs and poems.", reference: "Book of Psalms" },
    { title: "Shortest Verse", content: "Jesus wept.", description: "Two words showing Christ's humanity.", reference: "John 11:35" },
    { title: "The Tallest Giant", content: "Goliath", description: "Recorded as over 9 feet tall.", reference: "1 Samuel 17:4" },
    { title: "The First Miracle", content: "Water into wine", description: "Jesus performed His first miracle at a wedding in Cana.", reference: "John 2:1-11" },
    { title: "The Greatest Commandment", content: "Love the Lord your God", description: "Jesus summarized the Law with love for God and neighbor.", reference: "Matthew 22:37-40" },
    { title: "The Longest Reign", content: "Manasseh", description: "King Manasseh reigned 55 years, the longest in Judah.", reference: "2 Kings 21:1" },
    { title: "The First King of Israel", content: "Saul", description: "Israel's first king came from the tribe of Benjamin.", reference: "1 Samuel 10:1" },
    { title: "The First Book", content: "Genesis", description: "The Bible opens with the creation account.", reference: "Genesis 1:1" },
    { title: "The Last Book", content: "Revelation", description: "The Bible closes with the new heaven and new earth.", reference: "Revelation 21:1" },
    { title: "The Shortest Book", content: "3 John", description: "The shortest New Testament letter by length.", reference: "3 John 1:1" },
    { title: "The Longest Verse", content: "Esther 8:9", description: "A notably long verse in the decree of Esther.", reference: "Esther 8:9" },
    { title: "The First Man", content: "Adam", description: "Formed from the dust and given life by God.", reference: "Genesis 2:7" },
    { title: "The First Woman", content: "Eve", description: "Created from Adam and called the mother of all living.", reference: "Genesis 2:22" },
    { title: "The First Marriage", content: "Adam and Eve", description: "Marriage established in Eden.", reference: "Genesis 2:22-24" },
    { title: "The First Sin", content: "Disobedience in Eden", description: "The first sin entered through disobedience.", reference: "Genesis 3:6" },
    { title: "The First Promise", content: "Seed of the woman", description: "A promise of redemption after the fall.", reference: "Genesis 3:15" },
    { title: "The First Murder", content: "Cain and Abel", description: "Jealousy led to the first murder.", reference: "Genesis 4:8" },
    { title: "The First City", content: "Enoch", description: "Cain built a city and named it after his son.", reference: "Genesis 4:17" },
    { title: "The First Altar", content: "Noah", description: "Noah built an altar after the flood.", reference: "Genesis 8:20" },
    { title: "The First Covenant", content: "Covenant with Noah", description: "God promised never again to flood the earth.", reference: "Genesis 9:9-11" },
    { title: "The Rainbow Sign", content: "Covenant sign", description: "The rainbow was given as a sign of the covenant.", reference: "Genesis 9:13" },
    { title: "The First Prophet Named", content: "Abraham", description: "Abraham is called a prophet by God.", reference: "Genesis 20:7" },
    { title: "The First High Priest", content: "Aaron", description: "Aaron was appointed as the first high priest.", reference: "Exodus 28:1" },
    { title: "The First Passover", content: "Exodus deliverance", description: "Israel celebrated the first Passover in Egypt.", reference: "Exodus 12:11-14" },
    { title: "The First Sabbath Command", content: "Manna in the wilderness", description: "Israel was told to rest on the seventh day.", reference: "Exodus 16:23" },
    { title: "The Tabernacle Raised", content: "Wilderness worship", description: "The tabernacle was set up for worship.", reference: "Exodus 40:2" },
    { title: "The First Census", content: "Numbering Israel", description: "Israel was counted by tribe in the wilderness.", reference: "Numbers 1:2-3" },
    { title: "The First Judge", content: "Othniel", description: "Othniel delivered Israel from oppression.", reference: "Judges 3:9" },
    { title: "The Smallest Army", content: "Gideon's 300", description: "God saved Israel with only 300 men.", reference: "Judges 7:7" },
    { title: "The Strongest Judge", content: "Samson", description: "Samson's strength was legendary in Israel.", reference: "Judges 16:30" },
    { title: "The Shepherd King", content: "David", description: "David was anointed king while tending sheep.", reference: "1 Samuel 16:13" },
    { title: "The Giant Slain", content: "Goliath defeated", description: "David struck Goliath with a stone.", reference: "1 Samuel 17:49" },
    { title: "The Wisest King", content: "Solomon", description: "God granted Solomon extraordinary wisdom.", reference: "1 Kings 3:12" },
    { title: "The First Temple", content: "Solomon's Temple", description: "The first temple was built in Jerusalem.", reference: "1 Kings 6:1" },
    { title: "Fire from Heaven", content: "Mount Carmel", description: "God answered Elijah with fire.", reference: "1 Kings 18:38" },
    { title: "Oil Multiplied", content: "Widow's oil", description: "God multiplied oil through Elisha.", reference: "2 Kings 4:1-7" },
    { title: "Leprosy Healed", content: "Naaman", description: "Naaman was cleansed in the Jordan.", reference: "2 Kings 5:14" },
    { title: "The Great Fish", content: "Jonah", description: "Jonah spent three days in a great fish.", reference: "Jonah 1:17" },
    { title: "The Lions' Den", content: "Daniel", description: "God shut the lions' mouths.", reference: "Daniel 6:22" },
    { title: "The Fiery Furnace", content: "Three faithful men", description: "God preserved Shadrach, Meshach, and Abednego.", reference: "Daniel 3:25" },
    { title: "The Virgin Birth", content: "Prophecy", description: "A virgin will bear a son.", reference: "Isaiah 7:14" },
    { title: "The Suffering Servant", content: "Prophecy", description: "He was wounded for our transgressions.", reference: "Isaiah 53:5" },
    { title: "The Bethlehem Prophecy", content: "Messiah's birthplace", description: "A ruler will come from Bethlehem.", reference: "Micah 5:2" },
    { title: "The Sermon on the Mount", content: "Jesus teaches", description: "Jesus taught His disciples on a mountain.", reference: "Matthew 5:1-2" },
    { title: "The Lord's Prayer", content: "Model prayer", description: "Jesus taught His disciples how to pray.", reference: "Matthew 6:9-10" },
    { title: "The Great Commission", content: "Make disciples", description: "Jesus sent His followers to all nations.", reference: "Matthew 28:19" },
    { title: "Pentecost", content: "Spirit poured out", description: "The Holy Spirit filled the believers.", reference: "Acts 2:1-4" },
    { title: "The Conversion of Saul", content: "Paul called", description: "Saul met Jesus on the road to Damascus.", reference: "Acts 9:3-6" },
    { title: "The First Church", content: "Believers devoted", description: "The church gathered in teaching and fellowship.", reference: "Acts 2:42-47" },
    { title: "The Love Chapter", content: "Love defined", description: "Love is patient and kind.", reference: "1 Corinthians 13:4-7" },
    { title: "The Fruit of the Spirit", content: "Spirit's fruit", description: "Love, joy, peace, and more.", reference: "Galatians 5:22-23" },
    { title: "The Armor of God", content: "Spiritual armor", description: "Put on the full armor of God.", reference: "Ephesians 6:11" },
    { title: "The Hall of Faith", content: "Faith defined", description: "Faith is confidence in what we hope for.", reference: "Hebrews 11:1" },
    { title: "The New Creation", content: "All things new", description: "A new heaven and a new earth.", reference: "Revelation 21:1" },
    { title: "The Tree of Life", content: "Healing leaves", description: "The tree of life bears fruit each month.", reference: "Revelation 22:2" },
    { title: "The First King of Judah", content: "Rehoboam", description: "Rehoboam reigned over Judah.", reference: "1 Kings 12:1" },
    { title: "The Longest Reign in Israel", content: "Jeroboam II", description: "Jeroboam II reigned 41 years in Israel.", reference: "2 Kings 14:23" }
  ],
  funFacts: [
    { title: "Talking Donkey", content: "Balaam's Donkey", description: "God opened the donkey's mouth to speak to a prophet.", reference: "Numbers 22:28" },
    { title: "Left-Handed Warriors", content: "The Benjamites", description: "700 elite soldiers who never missed a shot.", reference: "Judges 20:16" },
    { title: "Iron Bed", content: "King Og", description: "His bed was 13 feet long and made of iron.", reference: "Deuteronomy 3:11" },
    { title: "Floating Axe Head", content: "Elisha's Miracle", description: "Elisha made heavy iron float on water.", reference: "2 Kings 6:6" },
    { title: "Long Day", content: "Joshua's Prayer", description: "The sun stood still for nearly a full day.", reference: "Joshua 10:13" },
    { title: "Coin in a Fish", content: "Temple Tax", description: "A fish provided the coin needed for the temple tax.", reference: "Matthew 17:24-27" },
    { title: "Donkey Sees an Angel", content: "Balaam's Journey", description: "The donkey saw the angel before Balaam did.", reference: "Numbers 22:23-31" },
    { title: "Hands Raised, Battle Won", content: "Moses and Amalek", description: "Israel prevailed while Moses held up his hands.", reference: "Exodus 17:11-12" },
    { title: "Ravens Deliver Food", content: "Elijah fed", description: "Ravens brought bread and meat to Elijah.", reference: "1 Kings 17:4-6" },
    { title: "Jar of Flour", content: "Widow's supply", description: "Flour and oil did not run out in famine.", reference: "1 Kings 17:14" },
    { title: "Bread from Heaven", content: "Manna", description: "Manna appeared each morning in the wilderness.", reference: "Exodus 16:15" },
    { title: "Quail at Evening", content: "Food in the desert", description: "Quail covered the camp for food.", reference: "Exodus 16:13" },
    { title: "Water from the Rock", content: "Provision", description: "Water flowed from a struck rock.", reference: "Exodus 17:6" },
    { title: "Cloud and Fire", content: "Guidance", description: "God led Israel by cloud and fire.", reference: "Exodus 13:21" },
    { title: "Sea Divided", content: "Red Sea", description: "The sea split so Israel crossed on dry ground.", reference: "Exodus 14:21" },
    { title: "Jordan Stopped", content: "Crossing", description: "The Jordan River stopped at harvest time.", reference: "Joshua 3:16" },
    { title: "Walls Fell", content: "Jericho", description: "The walls collapsed after the shout.", reference: "Joshua 6:20" },
    { title: "Shadow Went Back", content: "Hezekiah's sign", description: "The shadow moved backward on the steps.", reference: "2 Kings 20:11" },
    { title: "Chariot of Fire", content: "Elijah taken", description: "Elijah was taken up in a whirlwind.", reference: "2 Kings 2:11" },
    { title: "Writing on the Wall", content: "Mene Tekel", description: "A hand wrote a warning on the wall.", reference: "Daniel 5:5" },
    { title: "Lions' Mouths Shut", content: "Daniel", description: "God shut the lions' mouths.", reference: "Daniel 6:22" },
    { title: "Overnight Plant", content: "Jonah's shade", description: "A plant grew overnight to shade Jonah.", reference: "Jonah 4:6" },
    { title: "Olive Leaf", content: "Dove returns", description: "A dove returned with an olive leaf.", reference: "Genesis 8:11" },
    { title: "Burning Bush", content: "Holy ground", description: "A bush burned without being consumed.", reference: "Exodus 3:2" },
    { title: "Bronze Serpent", content: "Healing sign", description: "Those who looked at the serpent lived.", reference: "Numbers 21:9" },
    { title: "Fire on the Altar", content: "Carmel", description: "Fire fell and consumed the offering.", reference: "1 Kings 18:38" },
    { title: "Eutychus Raised", content: "Fell from window", description: "Paul restored a young man to life.", reference: "Acts 20:9-10" },
    { title: "Walking on Water", content: "Peter", description: "Peter walked on the sea toward Jesus.", reference: "Matthew 14:29" },
    { title: "Storm Stilled", content: "Jesus calms", description: "Jesus rebuked the wind and waves.", reference: "Mark 4:39" },
    { title: "Feeding 5,000", content: "Five loaves", description: "Thousands were fed with five loaves.", reference: "John 6:11" },
    { title: "Feeding 4,000", content: "Seven loaves", description: "Thousands were fed with seven loaves.", reference: "Mark 8:6-9" },
    { title: "Nile to Blood", content: "First plague", description: "The Nile turned to blood.", reference: "Exodus 7:20" },
    { title: "Frogs Everywhere", content: "Plague", description: "Frogs covered the land.", reference: "Exodus 8:6" },
    { title: "Hail with Fire", content: "Plague", description: "Hail and fire struck Egypt.", reference: "Exodus 9:24" },
    { title: "Star from Jacob", content: "Prophecy", description: "A star shall come out of Jacob.", reference: "Numbers 24:17" },
    { title: "City Gates Lifted", content: "Samson", description: "Samson carried the gates of Gaza.", reference: "Judges 16:3" },
    { title: "Fleece Sign", content: "Gideon", description: "Gideon tested the fleece.", reference: "Judges 6:37" },
    { title: "Wheels in Vision", content: "Ezekiel", description: "Wheels appeared in Ezekiel's vision.", reference: "Ezekiel 1:16" },
    { title: "Dry Bones", content: "Ezekiel", description: "Bones came together by God's word.", reference: "Ezekiel 37:7" },
    { title: "Angel Frees Peter", content: "Prison opened", description: "Peter was freed from prison by an angel.", reference: "Acts 12:7" },
    { title: "Earthquake Opens Jail", content: "Philippi", description: "An earthquake opened the prison doors.", reference: "Acts 16:26" },
    { title: "Tombs Opened", content: "At the cross", description: "Tombs opened when Jesus died.", reference: "Matthew 27:52" },
    { title: "Darkness at Noon", content: "Crucifixion", description: "Darkness covered the land at noon.", reference: "Matthew 27:45" },
    { title: "Fig Tree Withered", content: "Lesson", description: "A fig tree withered at Jesus' word.", reference: "Mark 11:20" },
    { title: "Staff to Serpent", content: "Moses' sign", description: "A staff became a serpent before Pharaoh.", reference: "Exodus 7:10" },
    { title: "Fish Net Overflow", content: "Great catch", description: "The net was filled with fish.", reference: "Luke 5:6" },
    { title: "Blind Man Sees", content: "Siloam", description: "A blind man received sight.", reference: "John 9:7" },
    { title: "Lame Man Walks", content: "Beautiful Gate", description: "A lame man walked at Peter's word.", reference: "Acts 3:8" },
    { title: "Angel Feeds Elijah", content: "Strength for journey", description: "An angel provided bread and water.", reference: "1 Kings 19:6" },
    { title: "Shipwreck Survival", content: "Paul on Malta", description: "All aboard reached land safely.", reference: "Acts 27:44" },
    { title: "Viper Harmless", content: "Paul on Malta", description: "A viper did not harm Paul.", reference: "Acts 28:5" },
    { title: "Locusts Cover Egypt", content: "Plague", description: "Locusts covered the land of Egypt.", reference: "Exodus 10:14" },
    { title: "Song of the Sea", content: "Moses sings", description: "Israel sang after crossing the sea.", reference: "Exodus 15:1" },
    { title: "Gideon's Dream", content: "Encouragement", description: "A dream strengthened Gideon's resolve.", reference: "Judges 7:13" },
    { title: "Sevenfold Sneeze", content: "Shunammite's son", description: "The child sneezed seven times and opened his eyes.", reference: "2 Kings 4:35" },
    { title: "Peter's Shadow", content: "Healing", description: "People hoped Peter's shadow would fall on them.", reference: "Acts 5:15" },
    { title: "Great Fish", content: "Jonah", description: "Jonah was in the fish three days.", reference: "Jonah 1:17" },
    { title: "Handkerchiefs Heal", content: "Paul", description: "Cloths that touched Paul brought healing.", reference: "Acts 19:12" }
  ],
  inspirational: [
    { title: "Strength", quote: "Those who hope in the Lord will renew their strength.", reference: "Isaiah 40:31" },
    { title: "Peace", quote: "The peace of God transcends all understanding.", reference: "Philippians 4:7" },
    { title: "Courage", quote: "Be strong and courageous. Do not be afraid.", reference: "Joshua 1:9" },
    { title: "Provision", quote: "My God will meet all your needs according to His riches.", reference: "Philippians 4:19" },
    { title: "Love", quote: "God is love, and whoever lives in love lives in God.", reference: "1 John 4:16" },
    { title: "The Lord Is Near", quote: "The Lord is near to all who call on him, to all who call on him in truth.", reference: "Psalm 145:18" },
    { title: "God Is Our Refuge", quote: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1" },
    { title: "Perfect Peace", quote: "You will keep in perfect peace those whose minds are steadfast, because they trust in you.", reference: "Isaiah 26:3" },
    { title: "Do Not Worry", quote: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6" },
    { title: "The Lord Is My Shepherd", quote: "The Lord is my shepherd; I lack nothing.", reference: "Psalm 23:1" },
    { title: "Fear No Evil", quote: "I will fear no evil, for you are with me.", reference: "Psalm 23:4" },
    { title: "Light and Salvation", quote: "The Lord is my light and my salvation; whom shall I fear?", reference: "Psalm 27:1" },
    { title: "Taste and See", quote: "Taste and see that the Lord is good.", reference: "Psalm 34:8" },
    { title: "Delight in the Lord", quote: "Delight yourself in the Lord and he will give you the desires of your heart.", reference: "Psalm 37:4" },
    { title: "Be Still", quote: "Be still, and know that I am God.", reference: "Psalm 46:10" },
    { title: "Create a Clean Heart", quote: "Create in me a clean heart, O God.", reference: "Psalm 51:10" },
    { title: "Cast Your Burden", quote: "Cast your burden on the Lord and he will sustain you.", reference: "Psalm 55:22" },
    { title: "Sun and Shield", quote: "The Lord God is a sun and shield.", reference: "Psalm 84:11" },
    { title: "Shelter of the Most High", quote: "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty.", reference: "Psalm 91:1" },
    { title: "This Is the Day", quote: "This is the day the Lord has made; let us rejoice and be glad in it.", reference: "Psalm 118:24" },
    { title: "Trust with All Your Heart", quote: "Trust in the Lord with all your heart.", reference: "Proverbs 3:5" },
    { title: "Guard Your Heart", quote: "Guard your heart, for everything you do flows from it.", reference: "Proverbs 4:23" },
    { title: "Commit Your Work", quote: "Commit your work to the Lord.", reference: "Proverbs 16:3" },
    { title: "Strength to the Weary", quote: "He gives strength to the weary.", reference: "Isaiah 40:29" },
    { title: "Fear Not", quote: "Do not fear, for I am with you.", reference: "Isaiah 41:10" },
    { title: "Waters and Fire", quote: "When you pass through the waters, I will be with you.", reference: "Isaiah 43:2" },
    { title: "Plans for Hope", quote: "I know the plans I have for you.", reference: "Jeremiah 29:11" },
    { title: "Great Is Faithfulness", quote: "Great is your faithfulness.", reference: "Lamentations 3:23" },
    { title: "Come to Me", quote: "Come to me, all who are weary and burdened.", reference: "Matthew 11:28" },
    { title: "Seek First", quote: "Seek first the kingdom of God.", reference: "Matthew 6:33" },
    { title: "Shine Your Light", quote: "Let your light shine before others.", reference: "Matthew 5:16" },
    { title: "Peace I Give", quote: "My peace I give you.", reference: "John 14:27" },
    { title: "True Vine", quote: "Apart from me you can do nothing.", reference: "John 15:5" },
    { title: "All Things for Good", quote: "In all things God works for the good of those who love him.", reference: "Romans 8:28" },
    { title: "Nothing Can Separate", quote: "Nothing can separate us from the love of God.", reference: "Romans 8:38-39" },
    { title: "Be Transformed", quote: "Be transformed by the renewing of your mind.", reference: "Romans 12:2" },
    { title: "Love Is Patient", quote: "Love is patient, love is kind.", reference: "1 Corinthians 13:4" },
    { title: "Grace Is Sufficient", quote: "My grace is sufficient for you.", reference: "2 Corinthians 12:9" },
    { title: "Crucified with Christ", quote: "I have been crucified with Christ.", reference: "Galatians 2:20" },
    { title: "Freedom in Christ", quote: "It is for freedom that Christ has set us free.", reference: "Galatians 5:1" },
    { title: "God's Workmanship", quote: "We are God's workmanship.", reference: "Ephesians 2:10" },
    { title: "Immeasurably More", quote: "He is able to do immeasurably more than all we ask.", reference: "Ephesians 3:20" },
    { title: "Good Work", quote: "He who began a good work in you will carry it on to completion.", reference: "Philippians 1:6" },
    { title: "God Works in You", quote: "God works in you to will and to act.", reference: "Philippians 2:13" },
    { title: "All Things", quote: "I can do all things through him who gives me strength.", reference: "Philippians 4:13" },
    { title: "Wholehearted Work", quote: "Whatever you do, work at it with all your heart.", reference: "Colossians 3:23" },
    { title: "Rejoice Always", quote: "Rejoice always.", reference: "1 Thessalonians 5:16" },
    { title: "Give Thanks", quote: "Give thanks in all circumstances.", reference: "1 Thessalonians 5:18" },
    { title: "The Lord Is Faithful", quote: "The Lord is faithful.", reference: "2 Thessalonians 3:3" },
    { title: "Throne of Grace", quote: "Approach God's throne of grace with confidence.", reference: "Hebrews 4:16" },
    { title: "Run with Perseverance", quote: "Run with perseverance the race marked out for us.", reference: "Hebrews 12:1" },
    { title: "Count It Joy", quote: "Consider it pure joy whenever you face trials.", reference: "James 1:2" },
    { title: "Cast Your Cares", quote: "Cast all your anxiety on him.", reference: "1 Peter 5:7" },
    { title: "He Forgives", quote: "He is faithful and just to forgive us.", reference: "1 John 1:9" },
    { title: "Perfect Love", quote: "Perfect love drives out fear.", reference: "1 John 4:18" },
    { title: "I Stand at the Door", quote: "I stand at the door and knock.", reference: "Revelation 3:20" },
    { title: "No More Tears", quote: "He will wipe every tear from their eyes.", reference: "Revelation 21:4" },
    { title: "Choose This Day", quote: "Choose this day whom you will serve.", reference: "Joshua 24:15" },
    { title: "Be Strong", quote: "Be strong and courageous.", reference: "Deuteronomy 31:6" }
  ]
};

function Facts() {
  const [activeTab, setActiveTab] = useState('records');
  const [dailyData, setDailyData] = useState({ records: [], funFacts: [], inspirational: [] });
  const [copySuccess, setCopySuccess] = useState('');

  // 2. DAILY ROTATION LOGIC
  useEffect(() => {
    const getDailySelection = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay); // Result is a number 1-366

      const itemsPerDay = 3; // How many items to show per category
      const selection = {};

      Object.keys(BIBLE_DATA).forEach(category => {
        const categoryArray = BIBLE_DATA[category];
        const startIndex = (dayOfYear * itemsPerDay) % categoryArray.length;
        
        // This slices the array to pick 3 items, wrapping around if necessary
        let selected = categoryArray.slice(startIndex, startIndex + itemsPerDay);
        
        // If we hit the end of the array, grab the remaining items from the start
        if (selected.length < itemsPerDay) {
          selected = [...selected, ...categoryArray.slice(0, itemsPerDay - selected.length)];
        }
        
        selection[category] = selected;
      });

      setDailyData(selection);
    };

    getDailySelection();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied to clipboard!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ color: '#7f8c8d' }}>Refreshing every 24 hours with new wisdom and facts.</p>
        <div style={{ fontSize: '12px', color: '#bdc3c7', fontWeight: 'bold' }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {['records', 'funFacts', 'inspirational'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: activeTab === tab ? '#3498db' : '#f1f2f6',
              color: activeTab === tab ? '#fff' : '#57606f',
              transition: '0.2s'
            }}
          >
            {tab === 'funFacts' ? 'Did You Know?' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {dailyData[activeTab].map((item, index) => (
          <div 
            key={index}
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: '1px solid #eee',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: '#3498db', fontWeight: '800' }}>{item.reference}</span>
              </header>
              <h3 style={{ fontSize: '18px', margin: '0 0 10px 0', color: '#2f3542' }}>{item.title}</h3>
              <p style={{ 
                fontSize: '15px', 
                color: '#57606f', 
                lineHeight: '1.5',
                fontStyle: activeTab === 'inspirational' ? 'italic' : 'normal'
              }}>
                "{item.content || item.quote}"
              </p>
              {item.description && (
                <p style={{ fontSize: '13px', color: '#a4b0be', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #eee' }}>
                  {item.description}
                </p>
              )}
            </div>
            
            <button 
              onClick={() => handleCopy(`${item.content || item.quote} (${item.reference})`)}
              style={{
                marginTop: '15px',
                padding: '6px',
                backgroundColor: '#f1f2f6',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#3498db',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Copy Verse
            </button>
          </div>
        ))}
      </div>

      {/* Toast Notification */}
      {copySuccess && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#2f3542',
          color: '#fff',
          padding: '10px 25px',
          borderRadius: '50px',
          fontSize: '14px',
          zIndex: 1000
        }}>
          {copySuccess}
        </div>
      )}
    </div>
  );
}

export default Facts;