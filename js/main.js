// 主要JavaScript文件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化變數
    let currentLanguage = 'zh'; // 預設語言為中文
    let currentTheme = 'dark'; // 預設主題為深色
    let chapters = [];
    let crimeMethods = [];
    let cases = [];
    
    // DOM元素
    const loadingScreen = document.getElementById('loading-screen');
    const langButtons = document.querySelectorAll('.lang-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const mainMenu = document.getElementById('main-menu');
    const menuLinks = document.querySelectorAll('.main-menu a');
    const sections = document.querySelectorAll('main > section');
    const contentOverlay = document.getElementById('content-overlay');
    const closeContent = document.getElementById('close-content');
    const contentTitle = document.getElementById('content-title');
    const contentBody = document.getElementById('content-body');
    const prevChapter = document.getElementById('prev-chapter');
    const nextChapter = document.getElementById('next-chapter');
    const methodOverlay = document.getElementById('method-overlay');
    const closeMethod = document.getElementById('close-method');
    const methodTitle = document.getElementById('method-title');
    const methodBody = document.getElementById('method-body');
    const caseOverlay = document.getElementById('case-overlay');
    const closeCase = document.getElementById('close-case');
    const caseTitle = document.getElementById('case-title');
    const caseBody = document.getElementById('case-body');
    const exploreBtn = document.getElementById('explore-btn');
    const crimeMethodBtns = document.querySelectorAll('.crime-method-btn');
    const caseDetailBtns = document.querySelectorAll('.case-detail-btn');
    
    // 載入畫面
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
    
    // 語言切換
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            if (lang !== currentLanguage) {
                currentLanguage = lang;
                updateLanguage();
                
                // 更新按鈕狀態
                langButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    // 更新語言函數
    function updateLanguage() {
        // 更新頁面標題
        document.title = currentLanguage === 'zh' ? '名偵探柯南犯罪手法大全' :
                         currentLanguage === 'en' ? 'Detective Conan Crime Methods Encyclopedia' :
                         currentLanguage === 'ja' ? '名探偵コナン犯罪手法大全' :
                         '명탐정 코난 범죄 수법 대전';
        
        // 更新導航菜單
        const menuItems = {
            'home': { zh: '首頁', en: 'Home', ja: 'ホーム', ko: '홈' },
            'chapters': { zh: '章節目錄', en: 'Chapters', ja: '章立て', ko: '챕터 목록' },
            'crime-methods': { zh: '犯罪手法', en: 'Crime Methods', ja: '犯罪手法', ko: '범죄 수법' },
            'case-analysis': { zh: '案例分析', en: 'Case Analysis', ja: '事例分析', ko: '사례 분석' },
            'interactive': { zh: '互動專區', en: 'Interactive', ja: 'インタラクティブ', ko: '인터랙티브' },
            'search': { zh: '搜尋', en: 'Search', ja: '検索', ko: '검색' },
            'about': { zh: '關於', en: 'About', ja: '概要', ko: '소개' }
        };
        
        menuLinks.forEach(link => {
            const section = link.getAttribute('data-section');
            if (menuItems[section]) {
                link.innerHTML = `<i class="${link.querySelector('i').className}"></i>${menuItems[section][currentLanguage]}`;
            }
        });
        
        // 更新英雄區塊
        const heroTitle = document.querySelector('.hero-title');
        const heroDescription = document.querySelector('.hero-description');
        const exploreBtn = document.getElementById('explore-btn');
        
        if (heroTitle) {
            heroTitle.textContent = currentLanguage === 'zh' ? '探索名偵探柯南的犯罪手法世界' :
                                   currentLanguage === 'en' ? 'Explore the World of Detective Conan Crime Methods' :
                                   currentLanguage === 'ja' ? '名探偵コナンの犯罪手法の世界を探る' :
                                   '명탐정 코난의 범죄 수법 세계 탐험';
        }
        
        if (heroDescription) {
            heroDescription.textContent = currentLanguage === 'zh' ? '深入分析柯南系列中的各種犯罪手法，從密室殺人到不在場證明，從心理誘導到科技犯罪，全面解析推理世界的精彩奧秘。' :
                                         currentLanguage === 'en' ? 'In-depth analysis of various crime methods in the Conan series, from locked room murders to alibis, from psychological manipulation to tech crimes, comprehensively decoding the fascinating mysteries of the detective world.' :
                                         currentLanguage === 'ja' ? 'コナンシリーズに登場する様々な犯罪手法を深く分析します。密室殺人からアリバイ、心理的操作からハイテク犯罪まで、推理世界の魅力的な謎を包括的に解読します。' :
                                         '코난 시리즈의 다양한 범죄 수법에 대한 심층 분석, 밀실 살인부터 알리바이, 심리적 조작부터 기술 범죄까지, 탐정 세계의 매혹적인 미스터리를 종합적으로 해독합니다.';
        }
        
        if (exploreBtn) {
            exploreBtn.textContent = currentLanguage === 'zh' ? '開始探索' :
                                    currentLanguage === 'en' ? 'Start Exploring' :
                                    currentLanguage === 'ja' ? '探索を始める' :
                                    '탐색 시작';
        }
        
        // 更新特色卡片
        const featureTitles = document.querySelectorAll('.feature-title');
        const featureDescriptions = document.querySelectorAll('.feature-description');
        
        const featureTexts = {
            titles: [
                { zh: '多語言支援', en: 'Multilingual Support', ja: '多言語サポート', ko: '다국어 지원' },
                { zh: '全面內容', en: 'Comprehensive Content', ja: '包括的なコンテンツ', ko: '포괄적인 콘텐츠' },
                { zh: '互動體驗', en: 'Interactive Experience', ja: 'インタラクティブな体験', ko: '인터랙티브 경험' }
            ],
            descriptions: [
                { zh: '提供中文、英文、日文和韓文四種語言版本，滿足不同地區讀者的需求。', 
                  en: 'Available in four languages: Chinese, English, Japanese, and Korean, catering to readers from different regions.', 
                  ja: '中国語、英語、日本語、韓国語の4つの言語版を提供し、さまざまな地域の読者のニーズを満たします。', 
                  ko: '중국어, 영어, 일본어, 한국어 등 4개 언어로 제공되어 다양한 지역의 독자 요구를 충족합니다.' },
                { zh: '涵蓋16個章節，詳細分析柯南系列中的各類犯罪手法和案例。', 
                  en: 'Covering 16 chapters, detailed analysis of various crime methods and cases in the Conan series.', 
                  ja: '16の章にわたり、コナンシリーズに登場するさまざまな犯罪手法と事例を詳細に分析しています。', 
                  ko: '16개의 장에 걸쳐 코난 시리즈의 다양한 범죄 수법과 사례를 상세히 분석합니다.' },
                { zh: '提供犯罪手法測驗、案件模擬器和視覺化圖表，增強學習體驗。', 
                  en: 'Offering crime method quizzes, case simulators, and visualization charts to enhance the learning experience.', 
                  ja: '犯罪手法クイズ、ケースシミュレーター、視覚化チャートを提供し、学習体験を向上させます。', 
                  ko: '범죄 수법 퀴즈, 사례 시뮬레이터 및 시각화 차트를 제공하여 학습 경험을 향상시킵니다.' }
            ]
        };
        
        featureTitles.forEach((title, index) => {
            if (featureTexts.titles[index]) {
                title.textContent = featureTexts.titles[index][currentLanguage];
            }
        });
        
        featureDescriptions.forEach((desc, index) => {
            if (featureTexts.descriptions[index]) {
                desc.textContent = featureTexts.descriptions[index][currentLanguage];
            }
        });
        
        // 更新犯罪手法卡片
        const crimeMethodTitles = document.querySelectorAll('.crime-method-title');
        const crimeMethodDescriptions = document.querySelectorAll('.crime-method-description');
        const statLabels = document.querySelectorAll('.stat-label');
        
        const crimeMethodTexts = {
            titles: [
                { zh: '密室殺人', en: 'Locked Room Murder', ja: '密室殺人', ko: '밀실 살인' },
                { zh: '不在場證明', en: 'Alibi', ja: 'アリバイ', ko: '알리바이' },
                { zh: '偽裝與冒充', en: 'Disguise & Impersonation', ja: '変装と偽装', ko: '변장과 사칭' },
                { zh: '毒殺手法', en: 'Poisoning Methods', ja: '毒殺手法', ko: '독살 방법' },
                { zh: '陷阱與機關', en: 'Traps & Mechanisms', ja: '罠と仕掛け', ko: '함정과 장치' },
                { zh: '心理操控', en: 'Psychological Manipulation', ja: '心理的操作', ko: '심리적 조작' },
                { zh: '定時殺人', en: 'Timed Murder', ja: '時限殺人', ko: '시한 살인' },
                { zh: '偽裝自殺', en: 'Disguised Suicide', ja: '偽装自殺', ko: '위장 자살' },
                { zh: '偽裝意外', en: 'Disguised Accident', ja: '偽装事故', ko: '위장 사고' }
            ],
            descriptions: [
                { zh: '在完全封閉的空間內實施的犯罪，通常涉及巧妙的機關設計或時間欺騙。', 
                  en: 'Crimes committed in completely sealed spaces, usually involving clever mechanism designs or time deception.', 
                  ja: '完全に密閉された空間で行われる犯罪で、通常は巧妙な仕掛けの設計や時間のトリックが関わっています。', 
                  ko: '완전히 밀폐된 공간에서 저지르는 범죄로, 보통 교묘한 장치 설계나 시간 속임수가 관련됩니다.' },
                { zh: '犯罪者通過各種手段製造假的不在場證明，使自己看似無法實施犯罪。', 
                  en: 'Criminals create false alibis through various means, making themselves appear unable to commit the crime.', 
                  ja: '犯人がさまざまな手段で偽のアリバイを作り、自分が犯行を行えなかったように見せかけます。', 
                  ko: '범죄자가 다양한 수단을 통해 거짓 알리바이를 만들어 자신이 범죄를 저지를 수 없었던 것처럼 보이게 합니다.' },
                { zh: '通過化妝、聲音偽裝等技術偽裝成他人身份實施犯罪或製造混亂。', 
                  en: 'Using techniques such as makeup and voice disguise to impersonate others for committing crimes or creating confusion.', 
                  ja: 'メイクアップや声の変装などの技術を使って他人になりすまし、犯罪を行ったり混乱を引き起こしたりします。', 
                  ko: '메이크업, 음성 변장 등의 기술을 사용하여 타인을 사칭해 범죄를 저지르거나 혼란을 일으킵니다.' },
                { zh: '使用各種毒物實施的犯罪，包括投毒方式、毒物選擇和掩蓋手段。', 
                  en: 'Crimes committed using various poisons, including poisoning methods, poison selection, and concealment techniques.', 
                  ja: 'さまざまな毒物を使用して行われる犯罪で、投毒方法、毒物の選択、隠蔽手段などが含まれます。', 
                  ko: '다양한 독물을 사용하여 저지르는 범죄로, 투독 방법, 독물 선택 및 은폐 기술이 포함됩니다.' },
                { zh: '利用物理機關、陷阱或自動裝置實施的犯罪，通常具有高度的技術性。', 
                  en: 'Crimes using physical mechanisms, traps, or automated devices, usually highly technical in nature.', 
                  ja: '物理的な仕掛け、罠、自動装置を使用して行われる犯罪で、通常は高度な技術性を持っています。', 
                  ko: '물리적 장치, 함정 또는 자동화된 장치를 사용하는 범죄로, 일반적으로 기술적으로 고도화되어 있습니다.' },
                { zh: '通過心理誘導、操控或欺騙實施的犯罪，如誘導自殺或間接殺人。', 
                  en: 'Crimes committed through psychological induction, manipulation, or deception, such as induced suicide or indirect murder.', 
                  ja: '心理的誘導、操作、欺瞞によって行われる犯罪で、自殺の誘導や間接的な殺人などがあります。', 
                  ko: '심리적 유도, 조작 또는 기만을 통해 저지르는 범죄로, 유도된 자살이나 간접적인 살인 등이 있습니다.' },
                { zh: '利用時間差或定時裝置實施的犯罪，包括延時殺人和提前設置的陷阱。', 
                  en: 'Crimes using time differences or timing devices, including delayed murders and pre-set traps.', 
                  ja: '時間差やタイミング装置を利用した犯罪で、遅延殺人や事前に設置された罠などが含まれます。', 
                  ko: '시간차나 타이밍 장치를 이용한 범죄로, 지연된 살인과 미리 설치된 함정 등이 포함됩니다.' },
                { zh: '將謀殺偽裝成自殺的手法，以及識別真假自殺的關鍵線索。', 
                  en: 'Methods of disguising murder as suicide, and key clues for identifying true versus fake suicides.', 
                  ja: '殺人を自殺に見せかける手法と、本物と偽物の自殺を見分けるための重要な手がかり。', 
                  ko: '살인을 자살로 위장하는 방법과 진짜와 가짜 자살을 식별하기 위한 주요 단서.' },
                { zh: '將謀殺偽裝成意外事故的手法，以及識別人為因素的關鍵。', 
                  en: 'Methods of disguising murder as accidental death, and key factors for identifying human intervention.', 
                  ja: '殺人を事故死に見せかける手法と、人為的要因を特定するための重要な要素。', 
                  ko: '살인을 사고사로 위장하는 방법과 인위적 요소를 식별하기 위한 주요 요소.' }
            ],
            statLabels: [
                { zh: '出現頻率', en: 'Frequency', ja: '出現頻度', ko: '출현 빈도' },
                { zh: '難度評分', en: 'Difficulty', ja: '難易度', ko: '난이도' }
            ]
        };
        
        crimeMethodTitles.forEach((title, index) => {
            if (crimeMethodTexts.titles[index]) {
                title.textContent = crimeMethodTexts.titles[index][currentLanguage];
            }
        });
        
        crimeMethodDescriptions.forEach((desc, index) => {
            if (crimeMethodTexts.descriptions[index]) {
                desc.textContent = crimeMethodTexts.descriptions[index][currentLanguage];
            }
        });
        
        statLabels.forEach((label) => {
            const labelText = label.textContent.trim();
            if (labelText === '出現頻率' || labelText === 'Frequency' || labelText === '出現頻度' || labelText === '출현 빈도') {
                label.textContent = crimeMethodTexts.statLabels[0][currentLanguage];
            } else if (labelText === '難度評分' || labelText === 'Difficulty' || labelText === '難易度' || labelText === '난이도') {
                label.textContent = crimeMethodTexts.statLabels[1][currentLanguage];
            }
        });
        
        // 更新案例分析卡片
        const sectionTitles = document.querySelectorAll('.section-title');
        const sectionDescriptions = document.querySelectorAll('.section-description');
        const caseCategories = document.querySelectorAll('.case-category');
        const caseCardTitles = document.querySelectorAll('.case-card-title');
        const caseCardDescriptions = document.querySelectorAll('.case-card-description');
        const caseDetailBtns = document.querySelectorAll('.case-detail-btn');
        
        const caseTexts = {
            sectionTitles: [
                { zh: '章節目錄', en: 'Chapters', ja: '章立て', ko: '챕터 목록' },
                { zh: '犯罪手法分類', en: 'Crime Methods Classification', ja: '犯罪手法分類', ko: '범죄 수법 분류' },
                { zh: '案例分析', en: 'Case Analysis', ja: '事例分析', ko: '사례 분석' },
                { zh: '互動專區', en: 'Interactive Zone', ja: 'インタラクティブゾーン', ko: '인터랙티브 존' },
                { zh: '搜尋', en: 'Search', ja: '検索', ko: '검색' },
                { zh: '關於本網站', en: 'About This Website', ja: 'このサイトについて', ko: '이 웹사이트 소개' },
                { zh: '精選案例分析', en: 'Featured Case Analysis', ja: '厳選された事例分析', ko: '주요 사례 분석' }
            ],
            sectionDescriptions: [
                { zh: '深入分析柯南系列中的經典案例，揭示犯罪手法背後的邏輯和細節', 
                  en: 'In-depth analysis of classic cases in the Conan series, revealing the logic and details behind the crime methods', 
                  ja: 'コナンシリーズの古典的な事例を深く分析し、犯罪手法の背後にある論理と詳細を明らかにします', 
                  ko: '코난 시리즈의 고전적인 사례를 심층 분석하여 범죄 수법 뒤에 숨겨진 논리와 세부 사항을 밝힙니다' }
            ],
            caseCategories: [
                { zh: '密室殺人', en: 'Locked Room Murder', ja: '密室殺人', ko: '밀실 살인' },
                { zh: '不在場證明', en: 'Alibi', ja: 'アリバイ', ko: '알리바이' },
                { zh: '科技犯罪', en: 'Tech Crime', ja: 'ハイテク犯罪', ko: '기술 범죄' }
            ],
            caseCardTitles: [
                { zh: '月光奏鳴曲殺人事件', en: 'Moonlight Sonata Murder Case', ja: '月光ソナタ殺人事件', ko: '월광 소나타 살인 사건' },
                { zh: '時間扭曲的不在場證明', en: 'Time-Twisted Alibi', ja: '時間のねじれたアリバイ', ko: '시간이 뒤틀린 알리바이' },
                { zh: '遊戲公司殺人事件', en: 'Game Company Murder Case', ja: 'ゲーム会社殺人事件', ko: '게임 회사 살인 사건' }
            ],
            caseCardDescriptions: [
                { zh: '一個利用火災和音樂計時的精巧密室殺人案，犯罪者如何在密室中實施犯罪並逃脫？', 
                  en: 'An elaborate locked room murder case using fire and music timing. How did the criminal commit the crime in a locked room and escape?', 
                  ja: '火災と音楽のタイミングを利用した精巧な密室殺人事件。犯人はどのように密室で犯行を行い、逃げ出したのか？', 
                  ko: '화재와 음악 타이밍을 이용한 정교한 밀실 살인 사건. 범인은 어떻게 밀실에서 범죄를 저지르고 탈출했는가?' },
                { zh: '犯罪者如何通過操縱時間和錄音裝置製造完美的不在場證明？一個關於時間欺騙的經典案例。', 
                  en: 'How did the criminal create a perfect alibi by manipulating time and recording devices? A classic case of time deception.', 
                  ja: '犯人はどのように時間と録音装置を操作して完璧なアリバイを作り出したのか？時間欺瞞の古典的な事例。', 
                  ko: '범인은 어떻게 시간과 녹음 장치를 조작하여 완벽한 알리바이를 만들어냈는가? 시간 속임수의 고전적인 사례.' },
                { zh: '一個利用電腦程序和虛擬現實技術實施的高科技犯罪，展示了科技如何被用於犯罪目的。', 
                  en: 'A high-tech crime using computer programs and virtual reality technology, demonstrating how technology can be used for criminal purposes.', 
                  ja: 'コンピュータプログラムとバーチャルリアリティ技術を使用したハイテク犯罪で、技術がどのように犯罪目的に使用されるかを示しています。', 
                  ko: '컴퓨터 프로그램과 가상 현실 기술을 사용한 하이테크 범죄로, 기술이 어떻게 범죄 목적으로 사용될 수 있는지 보여줍니다.' }
            ],
            buttons: [
                { zh: '查看詳情', en: 'View Details', ja: '詳細を見る', ko: '상세 보기' }
            ]
        };
        
        sectionTitles.forEach((title) => {
            const titleText = title.textContent.trim();
            for (let i = 0; i < caseTexts.sectionTitles.length; i++) {
                if (titleText === caseTexts.sectionTitles[i].zh || 
                    titleText === caseTexts.sectionTitles[i].en || 
                    titleText === caseTexts.sectionTitles[i].ja || 
                    titleText === caseTexts.sectionTitles[i].ko) {
                    title.textContent = caseTexts.sectionTitles[i][currentLanguage];
                    break;
                }
            }
        });
        
        sectionDescriptions.forEach((desc) => {
            if (caseTexts.sectionDescriptions[0]) {
                desc.textContent = caseTexts.sectionDescriptions[0][currentLanguage];
            }
        });
        
        caseCategories.forEach((category, index) => {
            if (caseTexts.caseCategories[index]) {
                category.textContent = caseTexts.caseCategories[index][currentLanguage];
            }
        });
        
        caseCardTitles.forEach((title, index) => {
            if (caseTexts.caseCardTitles[index]) {
                title.textContent = caseTexts.caseCardTitles[index][currentLanguage];
            }
        });
        
        caseCardDescriptions.forEach((desc, index) => {
            if (caseTexts.caseCardDescriptions[index]) {
                desc.textContent = caseTexts.caseCardDescriptions[index][currentLanguage];
            }
        });
        
        caseDetailBtns.forEach((btn) => {
            btn.textContent = caseTexts.buttons[0][currentLanguage];
        });
        
        // 更新關於頁面
        const aboutTexts = {
            paragraphs: [
                { zh: '《名偵探柯南犯罪手法大全》是一個專門分析和整理柯南系列中各種犯罪手法的網站，我們的目標是為柯南迷提供一個深入了解和學習推理知識的平台。', 
                  en: 'The "Detective Conan Crime Methods Encyclopedia" is a website dedicated to analyzing and organizing various crime methods in the Conan series. Our goal is to provide Conan fans with a platform for in-depth understanding and learning of deductive reasoning.', 
                  ja: '「名探偵コナン犯罪手法大全」は、コナンシリーズに登場するさまざまな犯罪手法を分析・整理することに特化したウェブサイトです。私たちの目標は、コナンファンに推理知識を深く理解し学ぶためのプラットフォームを提供することです。', 
                  ko: '"명탐정 코난 범죄 수법 대전"은 코난 시리즈의 다양한 범죄 수법을 분석하고 정리하는 데 전념하는 웹사이트입니다. 우리의 목표는 코난 팬들에게 추리 지식을 깊이 이해하고 학습할 수 있는 플랫폼을 제공하는 것입니다.' },
                { zh: '本網站內容基於青山剛昌的《名偵探柯南》系列作品，包括漫畫、動畫和劇場版等多個媒體形式中出現的犯罪手法、動機、手段和偵破方法，並進行了詳細的分類和分析。', 
                  en: 'The content of this website is based on Gosho Aoyama\'s "Detective Conan" series, including crime methods, motives, means, and detection methods appearing in various media forms such as manga, anime, and movies, with detailed classification and analysis.', 
                  ja: '本サイトのコンテンツは青山剛昌の「名探偵コナン」シリーズに基づいており、漫画、アニメ、映画などのさまざまなメディア形式に登場する犯罪手法、動機、手段、検出方法を詳細に分類・分析しています。', 
                  ko: '이 웹사이트의 내용은 아오야마 고쇼의 "명탐정 코난" 시리즈를 기반으로 하며, 만화, 애니메이션, 영화 등 다양한 미디어 형태에 등장하는 범죄 수법, 동기, 수단 및 탐지 방법을 상세히 분류하고 분석합니다.' },
                { zh: '網站提供中文、英文、日文和韓文四種語言版本，方便不同地區的讀者閱讀，同時我們還開發了互動測驗、案件模擬器和數據視覺化等功能，增強用戶的學習體驗。', 
                  en: 'The website is available in four languages: Chinese, English, Japanese, and Korean, making it convenient for readers from different regions. We have also developed features such as interactive quizzes, case simulators, and data visualization to enhance the user\'s learning experience.', 
                  ja: 'ウェブサイトは中国語、英語、日本語、韓国語の4つの言語で利用でき、さまざまな地域の読者に便利です。また、インタラクティブなクイズ、ケースシミュレーター、データの視覚化などの機能も開発し、ユーザーの学習体験を向上させています。', 
                  ko: '이 웹사이트는 중국어, 영어, 일본어, 한국어 등 4개 언어로 제공되어 다양한 지역의 독자들이 편리하게 이용할 수 있습니다. 또한 대화형 퀴즈, 사례 시뮬레이터, 데이터 시각화와 같은 기능을 개발하여 사용자의 학습 경험을 향상시켰습니다.' },
                { zh: '請注意，本網站純粹出於學術和娛樂目的，我們不鼓勵或教唆任何人實施犯罪行為。', 
                  en: 'Please note that this website is purely for academic and entertainment purposes. We do not encourage or instigate anyone to commit criminal acts.', 
                  ja: 'このウェブサイトは純粋に学術的およびエンターテイメント目的のためのものであり、犯罪行為を奨励または扇動するものではないことにご注意ください。', 
                  ko: '이 웹사이트는 순전히 학술 및 엔터테인먼트 목적으로 제작되었으며, 어떤 범죄 행위도 권장하거나 선동하지 않습니다.' }
            ],
            statLabels: [
                { zh: '章節', en: 'Chapters', ja: '章', ko: '챕터' },
                { zh: '案例分析', en: 'Case Analyses', ja: '事例分析', ko: '사례 분석' },
                { zh: '語言版本', en: 'Languages', ja: '言語版', ko: '언어 버전' },
                { zh: '犯罪手法類型', en: 'Crime Method Types', ja: '犯罪手法タイプ', ko: '범죄 수법 유형' }
            ]
        };
        
        const aboutParagraphs = document.querySelectorAll('.about-text p');
        aboutParagraphs.forEach((para, index) => {
            if (aboutTexts.paragraphs[index]) {
                para.textContent = aboutTexts.paragraphs[index][currentLanguage];
            }
        });
        
        const statLabels = document.querySelectorAll('.stat-label');
        statLabels.forEach((label) => {
            const labelText = label.textContent.trim();
            for (let i = 0; i < aboutTexts.statLabels.length; i++) {
                if (labelText === aboutTexts.statLabels[i].zh || 
                    labelText === aboutTexts.statLabels[i].en || 
                    labelText === aboutTexts.statLabels[i].ja || 
                    labelText === aboutTexts.statLabels[i].ko) {
                    label.textContent = aboutTexts.statLabels[i][currentLanguage];
                    break;
                }
            }
        });
        
        // 更新頁尾
        const footerTexts = {
            description: { 
                zh: '是一個專門分析和整理柯南系列中各種犯罪手法的網站，為柯南迷提供深入了解和學習推理知識的平台。', 
                en: 'is a website dedicated to analyzing and organizing various crime methods in the Conan series, providing Conan fans with a platform for in-depth understanding and learning of deductive reasoning.', 
                ja: 'はコナンシリーズに登場するさまざまな犯罪手法を分析・整理することに特化したウェブサイトで、コナンファンに推理知識を深く理解し学ぶためのプラットフォームを提供します。', 
                ko: '은 코난 시리즈의 다양한 범죄 수법을 분석하고 정리하는 데 전념하는 웹사이트로, 코난 팬들에게 추리 지식을 깊이 이해하고 학습할 수 있는 플랫폼을 제공합니다.' 
            },
            quickLinks: { 
                zh: '快速鏈接', 
                en: 'Quick Links', 
                ja: 'クイックリンク', 
                ko: '빠른 링크' 
            },
            followUs: { 
                zh: '關注我們', 
                en: 'Follow Us', 
                ja: 'フォローする', 
                ko: '팔로우하기' 
            },
            copyright: { 
                zh: '© 2025 名偵探柯南犯罪手法大全 | 本網站內容僅供學術研究目的，不鼓勵任何犯罪行為', 
                en: '© 2025 Detective Conan Crime Methods Encyclopedia | Website content is for academic research purposes only, no criminal behavior is encouraged', 
                ja: '© 2025 名探偵コナン犯罪手法大全 | ウェブサイトのコンテンツは学術研究目的のみであり、犯罪行為を奨励するものではありません', 
                ko: '© 2025 명탐정 코난 범죄 수법 대전 | 웹사이트 내용은 학술 연구 목적으로만 제공되며, 어떤 범죄 행위도 권장하지 않습니다' 
            }
        };
        
        const footerDescription = document.querySelector('.footer-logo p');
        if (footerDescription) {
            footerDescription.textContent = footerTexts.description[currentLanguage];
        }
        
        const quickLinksTitle = document.querySelector('.footer-links h4');
        if (quickLinksTitle) {
            quickLinksTitle.textContent = footerTexts.quickLinks[currentLanguage];
        }
        
        const followUsTitle = document.querySelector('.footer-social h4');
        if (followUsTitle) {
            followUsTitle.textContent = footerTexts.followUs[currentLanguage];
        }
        
        const copyright = document.querySelector('.footer-bottom p');
        if (copyright) {
            copyright.textContent = footerTexts.copyright[currentLanguage];
        }
        
        // 更新頁尾菜單
        const footerLinks = document.querySelectorAll('.footer-links a');
        footerLinks.forEach(link => {
            const href = link.getAttribute('href');
            const section = href.replace('#', '');
            if (menuItems[section]) {
                link.textContent = menuItems[section][currentLanguage];
            }
        });
        
        // 重新載入章節、犯罪手法和案例數據
        loadChapters();
        loadCrimeMethods();
        loadCases();
    }
    
    // 主題切換
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('light-theme');
        currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    });
    
    // 菜單切換
    menuToggle.addEventListener('click', function() {
        mainMenu.classList.toggle('active');
    });
    
    // 菜單項點擊
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            
            // 隱藏所有區段
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // 顯示目標區段
            document.getElementById(targetId).classList.add('active');
            
            // 關閉菜單（在移動設備上）
            mainMenu.classList.remove('active');
            
            // 如果是章節目錄，載入章節數據
            if (targetId === 'chapters') {
                loadChapters();
            }
            
            // 如果是犯罪手法，載入犯罪手法數據
            if (targetId === 'crime-methods') {
                loadCrimeMethods();
            }
            
            // 如果是案例分析，載入案例數據
            if (targetId === 'case-analysis') {
                loadCases();
            }
        });
    });
    
    // 開始探索按鈕
    exploreBtn.addEventListener('click', function() {
        // 隱藏所有區段
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // 顯示章節目錄區段
        document.getElementById('chapters').classList.add('active');
        
        // 載入章節數據
        loadChapters();
    });
    
    // 載入章節數據
    function loadChapters() {
        const chapterCards = document.getElementById('chapter-cards');
        
        // 如果已經載入過章節數據，則不重複載入
        if (chapters.length > 0 && chapterCards.children.length > 0) {
            return;
        }
        
        // 清空章節卡片容器
        chapterCards.innerHTML = '';
        
        // 獲取章節數據
        fetch(`src/data/chapters.json`)
            .then(response => response.json())
            .then(data => {
                chapters = data;
                
                // 創建章節卡片
                chapters.forEach(chapter => {
                    const chapterCard = document.createElement('div');
                    chapterCard.className = 'chapter-card';
                    
                    const chapterNumber = document.createElement('div');
                    chapterNumber.className = 'chapter-number';
                    chapterNumber.textContent = chapter.number;
                    
                    const chapterContent = document.createElement('div');
                    chapterContent.className = 'chapter-content';
                    
                    const chapterTitle = document.createElement('h3');
                    chapterTitle.className = 'chapter-title';
                    chapterTitle.textContent = chapter.title[currentLanguage];
                    
                    const chapterDescription = document.createElement('p');
                    chapterDescription.className = 'chapter-description';
                    chapterDescription.textContent = chapter.description[currentLanguage];
                    
                    const readButton = document.createElement('button');
                    readButton.className = 'btn secondary-btn';
                    readButton.textContent = currentLanguage === 'zh' ? '閱讀章節' :
                                            currentLanguage === 'en' ? 'Read Chapter' :
                                            currentLanguage === 'ja' ? '章を読む' :
                                            '챕터 읽기';
                    readButton.addEventListener('click', function() {
                        loadChapterContent(chapter.id);
                    });
                    
                    chapterContent.appendChild(chapterTitle);
                    chapterContent.appendChild(chapterDescription);
                    chapterContent.appendChild(readButton);
                    
                    chapterCard.appendChild(chapterNumber);
                    chapterCard.appendChild(chapterContent);
                    
                    chapterCards.appendChild(chapterCard);
                });
            })
            .catch(error => console.error('Error loading chapters:', error));
    }
    
    // 載入章節內容
    function loadChapterContent(chapterId) {
        const chapter = chapters.find(ch => ch.id === chapterId);
        
        if (!chapter) {
            return;
        }
        
        contentTitle.textContent = chapter.title[currentLanguage];
        contentBody.innerHTML = '<div class="loading-spinner"></div>';
        
        // 顯示內容覆蓋層
        contentOverlay.style.display = 'flex';
        
        // 獲取章節內容
        fetch(`src/data/translations/${currentLanguage}/${chapterId}.md`)
            .then(response => response.text())
            .then(text => {
                contentBody.innerHTML = marked.parse(text);
                
                // 設置上一章和下一章按鈕
                const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
                
                if (currentIndex > 0) {
                    prevChapter.style.display = 'block';
                    prevChapter.onclick = function() {
                        loadChapterContent(chapters[currentIndex - 1].id);
                    };
                } else {
                    prevChapter.style.display = 'none';
                }
                
                if (currentIndex < chapters.length - 1) {
                    nextChapter.style.display = 'block';
                    nextChapter.onclick = function() {
                        loadChapterContent(chapters[currentIndex + 1].id);
                    };
                } else {
                    nextChapter.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error loading chapter content:', error);
                contentBody.innerHTML = `<p class="error-message">${
                    currentLanguage === 'zh' ? '無法載入章節內容' :
                    currentLanguage === 'en' ? 'Failed to load chapter content' :
                    currentLanguage === 'ja' ? '章の内容を読み込めませんでした' :
                    '챕터 내용을 로드하지 못했습니다'
                }</p>`;
            });
    }
    
    // 關閉內容覆蓋層
    closeContent.addEventListener('click', function() {
        contentOverlay.style.display = 'none';
    });
    
    // 載入犯罪手法數據
    function loadCrimeMethods() {
        const crimeMethodGrid = document.getElementById('crime-method-grid');
        
        // 如果已經載入過犯罪手法數據，則不重複載入
        if (crimeMethods.length > 0 && crimeMethodGrid.children.length > 0) {
            return;
        }
        
        // 清空犯罪手法網格容器
        crimeMethodGrid.innerHTML = '';
        
        // 獲取犯罪手法數據
        fetch(`src/data/crime_methods.json`)
            .then(response => response.json())
            .then(data => {
                crimeMethods = data;
                
                // 創建犯罪手法卡片
                crimeMethods.forEach(method => {
                    const methodCard = document.createElement('div');
                    methodCard.className = `crime-method-card ${method.frequency}-frequency`;
                    
                    const methodIcon = document.createElement('div');
                    methodIcon.className = 'crime-method-icon';
                    methodIcon.innerHTML = `<i class="${method.icon}"></i>`;
                    
                    const methodTitle = document.createElement('h3');
                    methodTitle.className = 'crime-method-title';
                    methodTitle.textContent = method.title[currentLanguage];
                    
                    const methodDescription = document.createElement('p');
                    methodDescription.className = 'crime-method-description';
                    methodDescription.textContent = method.description[currentLanguage];
                    
                    const methodStats = document.createElement('div');
                    methodStats.className = 'crime-method-stats';
                    
                    const frequencyStat = document.createElement('div');
                    frequencyStat.className = 'stat';
                    frequencyStat.innerHTML = `
                        <span class="stat-label">${
                            currentLanguage === 'zh' ? '出現頻率' :
                            currentLanguage === 'en' ? 'Frequency' :
                            currentLanguage === 'ja' ? '出現頻度' :
                            '출현 빈도'
                        }</span>
                        <span class="stat-value">${
                            method.frequency === 'high' ? 
                                (currentLanguage === 'zh' ? '高' :
                                currentLanguage === 'en' ? 'High' :
                                currentLanguage === 'ja' ? '高' :
                                '높음') :
                            method.frequency === 'medium' ?
                                (currentLanguage === 'zh' ? '中' :
                                currentLanguage === 'en' ? 'Medium' :
                                currentLanguage === 'ja' ? '中' :
                                '중간') :
                                (currentLanguage === 'zh' ? '低' :
                                currentLanguage === 'en' ? 'Low' :
                                currentLanguage === 'ja' ? '低' :
                                '낮음')
                        }</span>
                    `;
                    
                    const difficultyStat = document.createElement('div');
                    difficultyStat.className = 'stat';
                    difficultyStat.innerHTML = `
                        <span class="stat-label">${
                            currentLanguage === 'zh' ? '難度評分' :
                            currentLanguage === 'en' ? 'Difficulty' :
                            currentLanguage === 'ja' ? '難易度' :
                            '난이도'
                        }</span>
                        <span class="stat-value">${method.difficulty}</span>
                    `;
                    
                    methodStats.appendChild(frequencyStat);
                    methodStats.appendChild(difficultyStat);
                    
                    const detailButton = document.createElement('button');
                    detailButton.className = 'btn secondary-btn';
                    detailButton.textContent = currentLanguage === 'zh' ? '查看詳細分析' :
                                              currentLanguage === 'en' ? 'View Detailed Analysis' :
                                              currentLanguage === 'ja' ? '詳細な分析を見る' :
                                              '상세 분석 보기';
                    detailButton.addEventListener('click', function() {
                        loadMethodContent(method.id);
                    });
                    
                    methodCard.appendChild(methodIcon);
                    methodCard.appendChild(methodTitle);
                    methodCard.appendChild(methodDescription);
                    methodCard.appendChild(methodStats);
                    methodCard.appendChild(detailButton);
                    
                    crimeMethodGrid.appendChild(methodCard);
                });
                
                // 添加犯罪手法過濾功能
                const filterBtns = document.querySelectorAll('.crime-method-filters .filter-btn');
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const filter = this.getAttribute('data-filter');
                        
                        // 更新按鈕狀態
                        filterBtns.forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        
                        // 過濾犯罪手法卡片
                        const cards = document.querySelectorAll('.crime-method-card');
                        cards.forEach(card => {
                            if (filter === 'all') {
                                card.style.display = 'block';
                            } else if (card.classList.contains(filter)) {
                                card.style.display = 'block';
                            } else {
                                card.style.display = 'none';
                            }
                        });
                    });
                });
            })
            .catch(error => console.error('Error loading crime methods:', error));
    }
    
    // 載入犯罪手法內容
    function loadMethodContent(methodId) {
        const method = crimeMethods.find(m => m.id === methodId);
        
        if (!method) {
            return;
        }
        
        methodTitle.textContent = method.title[currentLanguage];
        methodBody.innerHTML = '<div class="loading-spinner"></div>';
        
        // 顯示內容覆蓋層
        methodOverlay.style.display = 'flex';
        
        // 獲取犯罪手法內容
        fetch(`src/data/translations/${currentLanguage}/methods/${methodId}.md`)
            .then(response => response.text())
            .then(text => {
                methodBody.innerHTML = marked.parse(text);
            })
            .catch(error => {
                console.error('Error loading method content:', error);
                methodBody.innerHTML = `<p class="error-message">${
                    currentLanguage === 'zh' ? '無法載入犯罪手法內容' :
                    currentLanguage === 'en' ? 'Failed to load crime method content' :
                    currentLanguage === 'ja' ? '犯罪手法の内容を読み込めませんでした' :
                    '범죄 수법 내용을 로드하지 못했습니다'
                }</p>`;
            });
    }
    
    // 關閉犯罪手法覆蓋層
    closeMethod.addEventListener('click', function() {
        methodOverlay.style.display = 'none';
    });
    
    // 載入案例數據
    function loadCases() {
        const caseGrid = document.getElementById('case-grid');
        
        // 如果已經載入過案例數據，則不重複載入
        if (cases.length > 0 && caseGrid.children.length > 0) {
            return;
        }
        
        // 清空案例網格容器
        caseGrid.innerHTML = '';
        
        // 獲取案例數據
        fetch(`src/data/cases.json`)
            .then(response => response.json())
            .then(data => {
                cases = data;
                
                // 創建案例卡片
                cases.forEach(caseItem => {
                    const caseCard = document.createElement('div');
                    caseCard.className = `case-card ${caseItem.category}`;
                    
                    const caseTitle = document.createElement('h3');
                    caseTitle.className = 'case-title';
                    caseTitle.textContent = caseItem.title[currentLanguage];
                    
                    const caseDescription = document.createElement('p');
                    caseDescription.className = 'case-description';
                    caseDescription.textContent = caseItem.description[currentLanguage];
                    
                    const caseStats = document.createElement('div');
                    caseStats.className = 'case-stats';
                    
                    const ratingStat = document.createElement('div');
                    ratingStat.className = 'stat';
                    ratingStat.innerHTML = `
                        <span class="stat-label">${
                            currentLanguage === 'zh' ? '粉絲評分' :
                            currentLanguage === 'en' ? 'Fan Rating' :
                            currentLanguage === 'ja' ? 'ファン評価' :
                            '팬 평가'
                        }</span>
                        <span class="stat-value">${caseItem.rating}/5</span>
                    `;
                    
                    const episodeStat = document.createElement('div');
                    episodeStat.className = 'stat';
                    episodeStat.innerHTML = `
                        <span class="stat-label">${
                            currentLanguage === 'zh' ? '動畫集數' :
                            currentLanguage === 'en' ? 'Episode' :
                            currentLanguage === 'ja' ? 'エピソード' :
                            '에피소드'
                        }</span>
                        <span class="stat-value">${caseItem.episode}</span>
                    `;
                    
                    caseStats.appendChild(ratingStat);
                    caseStats.appendChild(episodeStat);
                    
                    const caseTags = document.createElement('div');
                    caseTags.className = 'case-tags';
                    
                    caseItem.tags.forEach(tag => {
                        const caseTag = document.createElement('span');
                        caseTag.className = 'case-tag';
                        caseTag.textContent = tag[currentLanguage];
                        caseTags.appendChild(caseTag);
                    });
                    
                    const detailButton = document.createElement('button');
                    detailButton.className = 'btn secondary-btn';
                    detailButton.textContent = currentLanguage === 'zh' ? '查看詳情' :
                                              currentLanguage === 'en' ? 'View Details' :
                                              currentLanguage === 'ja' ? '詳細を見る' :
                                              '상세 보기';
                    detailButton.addEventListener('click', function() {
                        loadCaseContent(caseItem.id);
                    });
                    
                    caseCard.appendChild(caseTitle);
                    caseCard.appendChild(caseDescription);
                    caseCard.appendChild(caseStats);
                    caseCard.appendChild(caseTags);
                    caseCard.appendChild(detailButton);
                    
                    caseGrid.appendChild(caseCard);
                });
                
                // 添加案例過濾功能
                const filterBtns = document.querySelectorAll('.case-filters .filter-btn');
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const filter = this.getAttribute('data-filter');
                        
                        // 更新按鈕狀態
                        filterBtns.forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        
                        // 過濾案例卡片
                        const cards = document.querySelectorAll('.case-card');
                        cards.forEach(card => {
                            if (filter === 'all') {
                                card.style.display = 'block';
                            } else if (card.classList.contains(filter)) {
                                card.style.display = 'block';
                            } else {
                                card.style.display = 'none';
                            }
                        });
                    });
                });
            })
            .catch(error => console.error('Error loading cases:', error));
    }
    
    // 載入案例內容
    function loadCaseContent(caseId) {
        const caseItem = cases.find(c => c.id === caseId);
        
        if (!caseItem) {
            return;
        }
        
        caseTitle.textContent = caseItem.title[currentLanguage];
        caseBody.innerHTML = '<div class="loading-spinner"></div>';
        
        // 顯示內容覆蓋層
        caseOverlay.style.display = 'flex';
        
        // 獲取案例內容
        fetch(`src/data/translations/${currentLanguage}/cases/${caseId}.md`)
            .then(response => response.text())
            .then(text => {
                caseBody.innerHTML = marked.parse(text);
            })
            .catch(error => {
                console.error('Error loading case content:', error);
                caseBody.innerHTML = `<p class="error-message">${
                    currentLanguage === 'zh' ? '無法載入案例內容' :
                    currentLanguage === 'en' ? 'Failed to load case content' :
                    currentLanguage === 'ja' ? '事例の内容を読み込めませんでした' :
                    '사례 내용을 로드하지 못했습니다'
                }</p>`;
            });
    }
    
    // 關閉案例覆蓋層
    closeCase.addEventListener('click', function() {
        caseOverlay.style.display = 'none';
    });
    
    // 首頁案例卡片點擊
    const homePageCaseDetailBtns = document.querySelectorAll('.case-card .case-detail-btn');
    homePageCaseDetailBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const caseId = this.getAttribute('data-case');
            loadCaseContent(caseId);
        });
    });
    
    // 初始化
    loadChapters();
});
