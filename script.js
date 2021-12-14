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
    const YTLINK_TEMPLATE = 'https://www.youtube.com/watch?v=[id]'

    let result_videos = []
    let queue_videos = [] 

    // Google Chart options constant
    const optionsGC = {
        title: 'Comparison of YouTube video statistics',
        hAxis: { title: 'Statistics', },
        vAxis: { title: 'Count' } };

    // DOM ELEMENTS
    const $submit = $('button[type=submit]')
    const $input = $('input')
    const $chart = $('#chart_div')
    const $queue = $('#queue')
    const $results = $('#results')

    // LISTENER EVENTS
    $submit.on('click', submitSearch)
    $results.on('click', 'img', selectVideo)
    $queue.on('click', 'button', removeFromQueue)
    $(window).resize(function () { drawGoogleChart() })

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
            this.containsStats = false
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
        // Set a callback to run when the Google Visualization API is loaded.
        google.charts.setOnLoadCallback(drawGoogleChart);

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
        return template.replace('[id]', videoId)
    }

    /** INTERNAL SPACE MANAGEMENT **/
    // load api data into local result array
    function loadYoutubeVideos(data) {
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

    function handleError(error) {
        console.log(error)
    }

    /** RENDERING FUNCTIONS **/
    
    function loadResults(data) {
        loadYoutubeVideos(data.items)
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
            drawGoogleChart()

            let $qu = $('<div id="qitem">')
                .append($('<button>')
                    .text('X'))

            renderResultThumbnail(YObj, $qu)

            $qu.append($(`<a href="${createYTLink(YObj.vid)}" target="_blank">`)
                .text('>'))

            $queue.append($qu)
        }, handleError)
    }
    
    function removeFromQueue(evt) {
        evt.preventDefault()
    }

    function createDataSet(title, values) {
        return [title, ...values]
    }

    function initData() {
        let data = [['Datasets', 'null']]
        data.push(['Views', 0])
        data.push(['Likes', 0])

        return google.visualization.arrayToDataTable(data)
    }

    function queueToDataTable() {

        // add all the titles
        let title = ['Datasets']

        queue_videos.forEach(elem => {
            title.push(elem.title)
        })

        let data = []
        data.push(title)

        data.push(createDataSet('Views', queue_videos.map(elem => {return parseInt(elem.viewCount)})))
        data.push(createDataSet('Likes', queue_videos.map(elem => {return parseInt(elem.likeCount)})))

        return google.visualization.arrayToDataTable(data)
    }

    function drawGoogleChart() {
        let data = queue_videos.length === 0 ? initData() : queueToDataTable()

        let chart = new google.visualization.ColumnChart($chart[0]);
        chart.draw(data, optionsGC);
    }


    // FUNCTIONS
    // Callback that creates and populates a data table,
    // instantiates the pie chart, passes in the data and
    // draws it.
    // function drawChart(evt) {
    //     evt.preventDefault()
    //
    //     // Create the data table.
    //     let data = new google.visualization.DataTable();
    //     data.addColumn('string', 'Topping');
    //     data.addColumn('number', 'Slices');
    //     data.addRows([
    //         ['Mushrooms', 5],
    //         ['Onions', 1],
    //         ['Olives', 1],
    //         ['Zucchini', 1],
    //     ]);
    //
    //     // Set chart options
    //     let options = {'title':'How Much Pizza I Ate Last Night',
    //         'width':500,
    //         'height':500};
    //
    //     // Instantiate and draw our chart, passing in some options.
    //     let chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    //     chart.draw(data, options);
    // }
// })