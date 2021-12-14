// =====================================
// Stephan Randle (GA) - Project Unit 1
// 12/10/21
// =====================================
//
// Compare the number of letter occurrences
// items[0]."statistics": {
//         "viewCount": "8239664",
//         "likeCount": "36646",
//         "favoriteCount": "0",
//         "commentCount": "716"
//       }
//
// $(function () {
    // GLOBAL VARIABLES
    const API = 'AIzaSyB9-3f8Dlx5-VOfcr_GCtocfwwMFSxwcq8'
    const SEARCH_API_TEMPLATE = 'https://youtube.googleapis.com/youtube/v3/search?type=video&part=snippet&q=[QUERY]&key=[API]'
    const STATISTICS_API_TEMPLATE = 'https://www.googleapis.com/youtube/v3/videos?part=statistics&id=[ID]&key=[API]'
    const YTLINK_TEMPLATE = 'https://www.youtube.com/watch?v=[ID]'
    const YTCHANNEL_TEMPLATE = 'https://www.youtube.com/channel/[ID]'

    let result_videos = []
    let queue_videos = []
    let gStyle
    let Colors = []

    const fadetime = 500

    // Google Chart options constant
    const viewChartOptions = {title: 'View Count', pieSliceText: 'value', legend: {position: 'bottom'}}
    const likeChartOptions = {title: 'Like Count', pieSliceText: 'value', legend: {position: 'bottom'}}

    // DOM ELEMENTS
    const $input = $('input')
    const $queue = $('#queue')
    const $results = $('#results')
    const $viewChart = $('#view_chart')
    const $likeChart = $('#like_chart')
    const $submit = $('button[type=submit]')

    // LISTENER EVENTS
    $submit.on('click', submitSearch)
    $results.on('click', 'img', selectVideo)
    $queue.on('click', 'button', removeFromQueue)
    $queue.on('click', 'img', showTable)
    $(window).resize(function () {
        drawGoogleCharts()
    })
    
    $(document).ready(function () {
        gStyle = getComputedStyle(document.documentElement)
        for(let i =0; i < 5; ++i) {
            let style = gStyle.getPropertyValue(`--main-color${i}`)
            style = style.replaceAll(' ', '')
            Colors.push(style)
        }
    })

    // initial statements
    initApplication()

    // manage incoming ajax data into a combined data type
    class YVid {
        constructor(ajax_obj, idx) {
            this.idx = idx
            this.vid = ajax_obj.id.videoId
            this.title = ajax_obj.snippet.title
            this.channelId = ajax_obj.snippet.channelId
            this.publishedAt = ajax_obj.snippet.publishedAt
            this.publishTime = ajax_obj.snippet.publishTime
            this.description = ajax_obj.snippet.description
            this.channelTitle = ajax_obj.snippet.channelTitle
            this.thumbnailUrl = ajax_obj.snippet.thumbnails.high.url
        }

        addStats(ajax_obj) {
            this.viewCount = ajax_obj.statistics.viewCount
            this.likeCount = ajax_obj.statistics.likeCount
            this.favoriteCount = ajax_obj.statistics.favoriteCount
            this.commentCount = ajax_obj.statistics.commentCount
            this.containsStats = true
        }
    }

    function initApplication() {
        // Load the Visualization API and the corechart package.
        google.charts.load('current', {'packages': ['corechart']});

        loadWindowMemory()

        // Set a callback to run when the Google Visualization API is loaded.
        google.charts.setOnLoadCallback(drawGoogleCharts);

    }

    /** GENERATOR FUNCTIONS **/
    function createSearchAPILink(query) {
        let t = SEARCH_API_TEMPLATE.replace('[QUERY]', query)
        t = t.replace('[API]', API)
        return t
    }

    function createStatisticsAPILink(id) {
        let t = STATISTICS_API_TEMPLATE.replace('[ID]', id)
        t = t.replace('[API]', API)
        return t
    }

    function createYTLink(videoId, template = YTLINK_TEMPLATE) {
        return template.replace('[ID]', videoId)
    }

    function createYTChannel(id) {
        return YTCHANNEL_TEMPLATE.replace('[ID]', id)
    }

    function createInfo(YObj, hidden=true) {
        let $t = $(`<table style="display: ${hidden ? 'none':'block'};">`)
        $t.html(`
        <tr>
        <td>Channel:</td>
        <td><a href="${createYTChannel(YObj.channelId)}" target="_blank">${YObj.channelTitle}</a></td>
        </tr>
        <tr>
        <td>Title:</td>
        <td><a href="${createYTLink(YObj.vid)}" target="_blank">${YObj.title}</a></td>
        </tr>
        <tr>
        <td>Published:</td>
        <td>${YObj.publishTime}</td>
        </tr>
        <tr>
        <td>Description:</td>
        <td>${YObj.description}</td>
        </tr>
        <tr>
        <td>Views:</td>
        <td>${YObj.viewCount}</td>
        </tr>
        <tr>
        <td>Likes:</td>
        <td>${YObj.likeCount}</td>
        </tr>
        `).addClass(hidden ? 'hide': 'show')
        return $t
    }

    /** INTERNAL SPACE MANAGEMENT **/
    // load api data into local result array
    function loadResultsFromAJAX(data) {
        let i = 0;

        data.forEach(elem => {
            let t = new YVid(elem, i++)
            result_videos.push(t)
        })
    }

    function clearResults() {
        $results.html('')
        result_videos = []
    }

    function loadWindowMemory() {

    }

    /** EVENT FUNCTIONS **/
    function submitSearch(evt) {
        evt.preventDefault()

        let ival = $input.val()
        if (ival === 'test') {
            $.getJSON('./assets/search.json', loadResults)
            $input.val('')
            return
        }

        $.ajax(createSearchAPILink($input.val())).then(loadResults, handleError)

        $input.val('')
    }

    function selectVideo(evt) {
        evt.preventDefault()

        let kept = result_videos[parseInt(evt.target.className)]

        renderQueue(kept)

        clearResults()
    }

    function removeFromQueue(evt) {
        evt.preventDefault()

        let t = $(evt.target.parentNode)
        t.fadeOut(fadetime, function () {
            t.remove()
            queue_videos.splice(parseInt(t[0].className), 1)
            shuffleQueueClasses()
            drawGoogleCharts()
        })
    }

    function shuffleQueueClasses() {
        let t = $('#qitem')
        for (let i = 0; i < t.length; i++)
            t[i].className = `${i}`
    }

    function showTable(evt) {
        let table = $(evt.target.parentNode).find('table')
        if (table[0].className === 'hide') {
            table[0].className = 'show'
            table.fadeIn(fadetime)
        } else {
            table[0].className = 'hide'
            table.fadeOut(fadetime)
        }
    }

    function handleError(error) {
        console.log(error)
    }

    /** RENDERING FUNCTIONS **/

    function loadResults(data) {
        loadResultsFromAJAX(data.items)
        renderResultThumbnails()
    }

    function renderResultThumbnail(YObj, elem = $results) {
        let thumbnail = $(`<img alt="${YObj.title}" src="${YObj.thumbnailUrl}">`)
            .addClass(`${YObj.idx}`)
        elem.append(thumbnail)
    }

    function renderResultThumbnails() {
        for (let i = 0; i < result_videos.length; i++)
            renderResultThumbnail(result_videos[i])
    }

    function renderQueue(YObj) {
        YObj.idx = queue_videos.length // reassign id

        $.ajax(createStatisticsAPILink(YObj.vid)).then(function (data) {
            YObj.addStats(data.items[0])
            queue_videos.push(YObj)
            drawGoogleCharts()

            let $qu = $('<div id="qitem">')
                .append($('<button>')
                    .text('X'))
                .addClass(`${YObj.idx}`)

            renderResultThumbnail(YObj, $qu)

            $qu.append($(`<a href="${createYTLink(YObj.vid)}" target="_blank">`)
                .text('>'))
                .append(createInfo(YObj))

            $queue.append($qu)
        }, handleError)
    }

    function initData() {
        let data = [['Title', 'Views']]
        data.push(['Null', 0])
        // data.push(['Likes', 0])

        return google.visualization.arrayToDataTable(data)
    }

    function queueViewDataTable() {

        // add all the titles
        let title = ['Title', 'Views']

        let data = []
        data.push(title)

        queue_videos.forEach(elem => {
            data.push([`${elem.title}`, parseInt(elem.viewCount)])
        })

        return google.visualization.arrayToDataTable(data)
    }

    function queueLikeDataTable() {
        let title = ['Title', 'Likes']
        let data = []
        data.push(title)

        queue_videos.forEach(elem => {
            data.push([`${elem.title}`, parseInt(elem.likeCount)])
        })

        return google.visualization.arrayToDataTable(data)
    }

    function drawGoogleCharts() {
        let view_data = queue_videos.length === 0 ? initData() : queueViewDataTable()
        let like_data = queue_videos.length === 0 ? initData() : queueLikeDataTable()

        viewChartOptions.backgroundColor = Colors[2]
        likeChartOptions.backgroundColor = Colors[2]

        let viewChart = new google.visualization.PieChart($viewChart[0]);
        let likeChart = new google.visualization.PieChart($likeChart[0]);

        viewChart.draw(view_data, viewChartOptions);
        likeChart.draw(like_data, likeChartOptions);
    }
// })