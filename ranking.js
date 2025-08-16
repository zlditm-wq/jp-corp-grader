const translations = {
    siteTitle: { jp: '企業ランク研究所', en: 'Company Rank Institute' },
    navOverview: { jp: '組織概要', en: 'Overview' },
    navResults: { jp: '選考結果', en: 'Results' },
    navCriteria: { jp: '選考基準', en: 'Criteria' },
    navMenuSearch: { jp: 'メニュー検索', en: 'Menu Search' },
    heroTitle: { jp: '【2025年】日本主要企業・就職ランキング', en: '[2025] Major Japanese Companies Job-Hunting Ranking' },
    imageOverlay: { jp: '企業ランク研究所', en: 'Company Rank Institute' },
    searchPlaceholder: { jp: '企業名で検索...', en: 'Search by company name...' },
    sortByScore: { jp: 'スコア順', en: 'Sort by Score' },
    sortByName: { jp: '名前順', en: 'Sort by Name' }
};

let allRankings = [];
let currentSort = 'score';

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        let obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i];
        });
        return obj;
    });
}

async function loadRankings() {
    const response = await fetch('rankings.csv');
    const csvText = await response.text();
    allRankings = parseCSV(csvText);
    const preferredLanguage = localStorage.getItem('preferredLanguage') || 'jp';
    setLanguage(preferredLanguage);
}

function getRankingsByScore(data) {
    const grouped = data.reduce((acc, item) => {
        acc[item.score] = acc[item.score] || [];
        acc[item.score].push({ jp: item.company_jp, en: item.company_en, score: item.score });
        return acc;
    }, {});
    return Object.keys(grouped).map(score => ({
        score: parseInt(score),
        companies: grouped[score]
    })).sort((a, b) => b.score - a.score);
}

function renderContent(lang) {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.dataset.i18nKey;
        if (translations[key] && translations[key][lang]) {
            el.innerHTML = translations[key][lang];
        }
    });
    document.getElementById('searchInput').placeholder = translations.searchPlaceholder[lang];
}

function renderRankings(lang, rankingData) {
    const container = document.getElementById('rankings-container');
    container.innerHTML = ''; // Clear previous rankings

    if (currentSort === 'score') {
        const rankedData = getRankingsByScore(rankingData);
        rankedData.forEach(tier => {
            const tierDiv = document.createElement('div');
            tierDiv.className = 'rank-tier fade-in';
            if (tier.score === 80) tierDiv.id = 'rank-list-start';

            const tierHeader = document.createElement('div');
            tierHeader.className = 'tier-header';
            const tierTitle = document.createElement('span');
            tierTitle.className = 'tier-title';
            if (tier.score >= 80) tierTitle.classList.add('tier-80');
            else if (tier.score >= 70) tierTitle.classList.add('tier-70');
            else if (tier.score >= 60) tierTitle.classList.add('tier-60');
            else tierTitle.classList.add('tier-50');
            tierTitle.textContent = tier.score;
            tierHeader.appendChild(tierTitle);

            const companyContainer = document.createElement('div');
            companyContainer.className = 'company-container';

            tier.companies.forEach(company => {
                const companySpan = document.createElement('span');
                companySpan.className = 'company-name';
                companySpan.setAttribute('data-jp', company.jp);
                companySpan.setAttribute('data-en', company.en);
                companySpan.textContent = company[lang];
                companyContainer.appendChild(companySpan);
            });

            tierDiv.appendChild(tierHeader);
            tierDiv.appendChild(companyContainer);
            container.appendChild(tierDiv);
        });
    } else { // currentSort === 'name'
        const sortedData = [...rankingData].sort((a, b) => {
            return a[`company_${lang}`].localeCompare(b[`company_${lang}`]);
        });

        sortedData.forEach(item => {
            const tierDiv = document.createElement('div');
            tierDiv.className = 'rank-tier fade-in';

            const tierHeader = document.createElement('div');
            tierHeader.className = 'tier-header';
            const tierTitle = document.createElement('span');
            tierTitle.className = 'tier-title';
            if (item.score >= 80) tierTitle.classList.add('tier-80');
            else if (item.score >= 70) tierTitle.classList.add('tier-70');
            else if (item.score >= 60) tierTitle.classList.add('tier-60');
            else tierTitle.classList.add('tier-50');
            tierTitle.textContent = item.score;
            tierHeader.appendChild(tierTitle);

            const companyContainer = document.createElement('div');
            companyContainer.className = 'company-container';
            const companySpan = document.createElement('span');
            companySpan.className = 'company-name';
            companySpan.setAttribute('data-jp', item.company_jp);
            companySpan.setAttribute('data-en', item.company_en);
            companySpan.textContent = item[`company_${lang}`];
            companyContainer.appendChild(companySpan);

            tierDiv.appendChild(tierHeader);
            tierDiv.appendChild(companyContainer);
            container.appendChild(tierDiv);
        });
    }
}

function setLanguage(lang) {
    renderContent(lang);
    const searchInput = document.getElementById('searchInput');
    const filter = searchInput.value.toUpperCase();
    const filteredData = allRankings.filter(item => {
        const name = item[`company_${lang}`].toUpperCase();
        return name.indexOf(filter) > -1;
    });
    renderRankings(lang, filteredData);

    document.querySelectorAll('.lang-switch span[data-lang]').forEach(el => {
        el.classList.toggle('active', el.dataset.lang === lang);
        el.classList.toggle('inactive', el.dataset.lang !== lang);
    });
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;
}

function initializeLangSwitch() {
    document.querySelectorAll('.lang-switch span[data-lang]').forEach(el => {
        el.addEventListener('click', (e) => {
            setLanguage(e.target.dataset.lang);
        });
    });
}

function initializeSearch() {
    document.getElementById('searchInput').addEventListener('keyup', function() {
        let filter = this.value.toUpperCase();
        const currentLang = localStorage.getItem('preferredLanguage') || 'jp';
        const filteredData = allRankings.filter(item => {
            const name = item[`company_${currentLang}`].toUpperCase();
            return name.indexOf(filter) > -1;
        });

        renderRankings(currentLang, filteredData);
    });
}

function initializeSortButtons() {
    const sortByScoreBtn = document.getElementById('sortByScoreBtn');
    const sortByNameBtn = document.getElementById('sortByNameBtn');

    sortByScoreBtn.addEventListener('click', () => {
        currentSort = 'score';
        sortByScoreBtn.classList.add('active');
        sortByNameBtn.classList.remove('active');
        const currentLang = localStorage.getItem('preferredLanguage') || 'jp';
        const searchInput = document.getElementById('searchInput');
        const filter = searchInput.value.toUpperCase();
        const filteredData = allRankings.filter(item => {
            const name = item[`company_${currentLang}`].toUpperCase();
            return name.indexOf(filter) > -1;
        });
        renderRankings(currentLang, filteredData);
    });

    sortByNameBtn.addEventListener('click', () => {
        currentSort = 'name';
        sortByNameBtn.classList.add('active');
        sortByScoreBtn.classList.remove('active');
        const currentLang = localStorage.getItem('preferredLanguage') || 'jp';
        const searchInput = document.getElementById('searchInput');
        const filter = searchInput.value.toUpperCase();
        const filteredData = allRankings.filter(item => {
            const name = item[`company_${currentLang}`].toUpperCase();
            return name.indexOf(filter) > -1;
        });
        renderRankings(currentLang, filteredData);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeLangSwitch();
    loadRankings();
    initializeSearch();
    initializeSortButtons();
});