// =====================================
// Stephan Randle (GA) - Project Unit 1
// 12/10/21
// =====================================
//
// Compare the number of letter occurrences
//
$(function () {
    // GLOBAL VARIABLES
    const API = 'AIzaSyB9-3f8Dlx5-VOfcr_GCtocfwwMFSxwcq8'
    const API_TEMPLATE = 'https://youtube.googleapis.com/youtube/v3/search?type=video&part=snippet&q=[QUERY]&key=[API]'
    const YTLINK_TEMPLATE = 'https://www.youtube.com/watch?v=[id]'

    let result_videos = []
    let queue_videos = []

    let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

    // DOM ELEMENTS
    const $submit = $('button[type=submit]')
    const $input = $('input')
    const $chart = $('#chart_div')
    const $queue = $('#queue')
    const $results = $('#results')

    const testImgLoc = ""

    // LISTENER EVENTS
    $submit.on('click', submitSearch)
    $results.on('click', 'img', selectVideo)
    $(window).resize(function () {
        drawGoogleChart()
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
    }

    function initApplication() {
        // Load the Visualization API and the corechart package.
        google.charts.load('current', {'packages': ['corechart']});
        // Set a callback to run when the Google Visualization API is loaded.
        google.charts.setOnLoadCallback(drawGoogleChart);

    }

    /** GENERATOR FUNCTIONS **/
    function createAPILink(query) {
        let t = API_TEMPLATE.replace('[QUERY]', query)
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

    function collectOccurrences(str, char) {
        let occ = 0;
        str = str.toUpperCase()
        char = char.toUpperCase()

        for (let i = 0; i < str.length; ++i)
            if (str[i] === char) {
                occ++
                console.log(str[i - 1] + str[i] + str[i + 1])
            }

        return occ;
    }


    /** EVENT FUNCTIONS **/
    function submitSearch(evt) {
        evt.preventDefault()

        let ival = $input.val()
        if (ival === 'test') {
            $.getJSON('./assets/example.json', function (json) {
                loadYoutubeVideos(json.items)
                renderResultThumbnails()
            })
            return
        }

        $.ajax(createAPILink($input.val())).then(function (data) {
            loadYoutubeVideos(data.items)
            renderResultThumbnails()
        }, handleError)

        $input.val('')
    }

    function selectVideo(evt) {
        evt.preventDefault()

        let kept = result_videos[parseInt(evt.target.className)]

        renderQueue(kept)

        drawGoogleChart()

        clearResults()
    }

    function handleError(error) {
        console.log(error)
    }

    /** RENDERING FUNCTIONS **/

    function renderThumbnail(YObj, elem = $results) {
        let thumbnail = $(`<img alt="${YObj.title}" src="${YObj.thumbnailUrl}">`)
            .addClass(`${YObj.idx}`)
        elem.append(thumbnail)
    }

    function renderResultThumbnails() {
        for (let i = 0; i < result_videos.length; i++)
            renderThumbnail(result_videos[i])
    }

    function renderQueue(YObj) {
        YObj.idx = queue_videos.length // reassign id

        queue_videos.push(YObj)

        let $qu = $('<div id="qitem">')
            .append($('<button>')
                .text('X'))

        renderThumbnail(YObj, $qu)

        $qu.append($(`<a href="${createYTLink(YObj.vid)}" target="_blank">`)
            .text('>'))

        $queue.append($qu)
    }

    function createDataSet(title, values) {
        return [title, ...values]
    }

    function initData() {
        let data = [['Letters', 'null']]
        letters.forEach(letter => {
            data.push([`${letter}`, 0])
        })

        return google.visualization.arrayToDataTable(data)
    }

    function queueToDataTable() {

        // add all the titles
        let title = ['Datasets']

        queue_videos.forEach(elem => {
            title.push(elem.title)
        })

        let data = [title]

        letters.forEach(letter => {
            let occur = queue_videos.map(elem => {
                return collectOccurrences(elem.description, letter)
            })
            data.push(createDataSet(`${letter.toUpperCase()}`, occur))
        })

        return google.visualization.arrayToDataTable(data)
    }

    function drawGoogleChart() {
        let data = queue_videos.length === 0 ? initData() : queueToDataTable()

        const options = {
            title: 'Occurrences of letters in YouTube video descriptions',
            colors: ['#9575cd', '#33ac71'],
            hAxis: {
                title: 'Letters',
            },
            vAxis: {
                title: 'Occurrences'
            }
        };

        let chart = new google.visualization.ColumnChart($chart[0]);
        chart.draw(data, options);
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
})