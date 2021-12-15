// =====================================
// Stephan Randle (GA) - Project Unit 1
// 12/10/21
// =====================================
//
//
$(function () {
    // GLOBAL VARIABLES
    // const API = 'AIzaSyB9-3f8Dlx5-VOfcr_GCtocfwwMFSxwcq8'
    const API = 'AIzaSyANIJpTgj86KjrZvtD7NyHjfKPKgwxIu-U'
    const SEARCH_API_TEMPLATE = 'https://youtube.googleapis.com/youtube/v3/search?type=video&part=snippet&q=[QUERY]&key=[API]'
    const STATISTICS_API_TEMPLATE = 'https://www.googleapis.com/youtube/v3/videos?part=statistics&id=[ID]&key=[API]'
    const YTLINK_TEMPLATE = 'https://www.youtube.com/watch?v=[ID]'
    const YTCHANNEL_TEMPLATE = 'https://www.youtube.com/channel/[ID]'

    let result_videos = []
    let queue_videos = []
    let gStyle

    const fadetime = 500

    // Google Chart options constant
    const chartOptions = {
        title: 'View Count',
        pieSliceText: 'value',
        fontName: 'Inconsolata',
        chartArea: {left: 0},
        titleTextStyle: {fontSize: 24},
        legend: {position: 'bottom'},
        is3d: true
    }

    // DOM ELEMENTS
    const $input = $('input[type=text]')
    const $queue = $('#queue')
    const $results = $('#results')
    const $viewChart = $('#view_chart')
    const $likeChart = $('#like_chart')
    const $submit = $('button[type=submit]')

    // LISTENER EVENTS
    $submit.on('click', handleSubmitSearch)
    $results.on('click', 'img', handleSelectVideo)
    $queue.on('click', 'button', handleRemoveFromQueue)
    $queue.on('click', 'img', showTable)
    $(window).resize(function () {
        drawGoogleCharts()
    })
    $('body').keypress(function (k) {
        $input[0].focus()  // focus text field
    })

    // window load
    $(document).ready(function () {

        // load global style
        gStyle = getComputedStyle(document.documentElement)
        chartOptions.colors = []
        for (let i = 0; i < 5; ++i) {
            let style = gStyle.getPropertyValue(`--main-color${i}`)
            style = style.replaceAll(' ', '')
            if (i < 4)
                chartOptions.colors.push(style)
            if (i === 4)
                chartOptions.backgroundColor = style
        }
        let istyle = $('<style>')
        let template = '#qitem:nth-child([n]){background-color: [val];\n}'
        let istylehtml = ''
        for (let i = 0; i < chartOptions.colors.length; ++i) {
            let t = template.replace('[n]', `${i + 1}`);
            t = t.replace('[val]', chartOptions.colors[i])
            istylehtml += t
        }

        istyle.html(istylehtml)
        $('head').append(istyle)

        // initial statements
        initApplication()
    })


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
        }
    }

    /** INITIAL LOADING **/
    function initApplication() {
        // Load the Visualization API and the corechart package.
        google.charts.load('current', {'packages': ['corechart']});

        // Set a callback to run when the Google Visualization API is loaded.
        google.charts.setOnLoadCallback(drawGoogleCharts);

        loadWindowMemory()
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

    function createInfo(YObj, hidden = true) {
        let $t = $(`<table style="display: ${hidden ? 'none' : 'block'};">`)
        $t.html(`
        <tr>
        <td>Channel</td>
        <td><a href="${createYTChannel(YObj.channelId)}" target="_blank">${YObj.channelTitle}</a></td>
        </tr>
        <tr>
        <td>Title</td>
        <td><a href="${createYTLink(YObj.vid)}" target="_blank">${YObj.title}</a></td>
        </tr>
        <tr>
        <td>Published</td>
        <td>${YObj.publishTime}</td>
        </tr>
        <tr>
        <td>Description</td>
        <td>${YObj.description}</td>
        </tr>
        ${YObj.viewCount !== undefined ? // only add viewCount if updated
        `<tr>
        <td>Views</td>
        <td>${YObj.viewCount}</td>
        </tr>
        <tr>
        <td>Likes</td>
        <td>${YObj.likeCount}</td>
        </tr>` : ''}`)
            .addClass(hidden ? 'hide' : 'show')
        return $t
    }

    /** INTERNAL SPACE MANAGEMENT **/
    function loadResults(data) {
        if ($results.html() !== null)
            clearResults()
        let i = 0;
        data.items.forEach(elem => {
            let t = new YVid(elem, i++)
            result_videos.push(t)
        })
        renderAllResults()
    }

    function clearResults() {
        $results.html('')
        result_videos = []
    }

    /** WINDOW MEMORY **/
    function loadWindowMemory() {
        let json = window.localStorage.getItem('yt')
        if (json !== null)
            queue_videos = JSON.parse(json)
        queue_videos.forEach(elem => {
            renderQueueItem(elem)
        })
    }

    function updateLocalStorage() {
        window.localStorage.setItem('yt', JSON.stringify(queue_videos))
    }

    /** EVENT FUNCTIONS **/
    function handleSubmitSearch(evt) {
        evt.preventDefault()

        let ival = $input.val()
        if (ival === '') {
            $results.html('<span>Need to insert valid input...</span>')
            return
        } if (ival === '`test') {
            $.getJSON('./assets/search.json', loadResults)
            $input.val('')
            return
        }

        $.ajax(createSearchAPILink($input.val())).then(loadResults, handleError)

        $input.val('')
    }

    function handleSelectVideo(evt) {
        evt.preventDefault()

        let kept = result_videos[parseInt(evt.target.className)]

        renderQueue(kept)

        clearResults()
    }

    function handleRemoveFromQueue(evt) {
        evt.preventDefault()

        let t = $(evt.target.parentNode)
        console.log(t)
        t.fadeOut(fadetime, function () {
            queue_videos.splice(parseInt(t[0].className), 1)
            t.remove()
            updateLocalStorage()
            drawGoogleCharts()
            shuffleQueueClasses()
        })
    }

    function handleError(error) {
        console.log(error)
        alert('Sorry an error occurred')
    }

    function shuffleQueueClasses() {
        let t = document.querySelectorAll('#qitem')
        for (let i = 0; i < t.length; i++) {
            t[i].className = `${i}`
            queue_videos[i].idx = i
        }
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

    /** RENDERING FUNCTIONS **/

    // RESULT
    function renderThumbnail(YObj, elem) {
        let thumbnail = $(`<img alt="${YObj.title}" src="${YObj.thumbnailUrl}">`)
            .addClass(`${YObj.idx}`)
        elem.append(thumbnail)
    }

    function renderResult(YObj) {
        let $ru = $('<div id="ritem">')
            .addClass(`${YObj.idx}`)
        renderThumbnail(YObj, $ru)
        $ru.append(createInfo(YObj, false))
        $results.append($ru)
    }

    function renderAllResults() {
        for (let i = 0; i < result_videos.length; i++)
            renderResult(result_videos[i])
    }

    // QUEUE
    function renderQueueItem(YObj) {
        let $qu = $('<div id="qitem">')
            .append($('<button>')
                .text('X'))
            .addClass(`${YObj.idx}`)

        renderThumbnail(YObj, $qu)

        $qu.append($(`<a href="${createYTLink(YObj.vid)}" target="_blank">`)
            .text(`${YObj.title.slice(0, 35)} ->`))
            .append(createInfo(YObj))

        $queue.append($qu)
    }

    function renderQueue(YObj) {
        YObj.idx = queue_videos.length // reassign id

        $.ajax(createStatisticsAPILink(YObj.vid)).then(function (data) {
            YObj.addStats(data.items[0])
            queue_videos.push(YObj)
            updateLocalStorage()
            drawGoogleCharts()
            renderQueueItem(YObj)
        }, handleError)
    }

    /** GOOGLE CHART FUNCTIONS **/

    function initData() {
        return createDataTable('NULL', ['NULL', 0])
    }

    function createDataTable(name, data) {
        let rdata = [['Title', name]]
        data.forEach(elem => {
            rdata.push([elem[0], elem[1]])
        })
        return google.visualization.arrayToDataTable(rdata)
    }

    function drawGoogleCharts() {
        // VIEW COUNT
        chartOptions.title = 'View Count'
        let data = queue_videos.length === 0 ? initData() : createDataTable('View', queue_videos.map(elem => {
            return [elem.title, parseInt(elem.viewCount)]
        }))
        let chart = new google.visualization.PieChart($viewChart[0]);

        chart.draw(data, chartOptions);

        // LIKE COUNT
        chartOptions.title = 'Like Count'
        data = queue_videos.length === 0 ? initData() : createDataTable('Like', queue_videos.map(elem => {
            return [elem.title, parseInt(elem.likeCount)]
        }))
        chart = new google.visualization.PieChart($likeChart[0]);

        chart.draw(data, chartOptions);
    }
})