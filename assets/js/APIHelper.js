const SERVICE_KEY = decodeURIComponent('8%2FWRFL2d6l3NohzAMLUIkaf6%2B%2FbtECXrItReccN%2FmT4tNGyMSU0nMLE3MQjj%2FOr2vtz8ZqLxd4DJa7O%2FYbQbAA%3D%3D');

function APICallWithKeyword(method, keyword, pageNum) {
    pageNum = pageNum || 1;

    let datas = {
        ServiceKey: SERVICE_KEY,
        MobileApp: 'TestWeb',
        MobileOS: 'ETC',
        pageNo: pageNum,
        keyword: keyword,
        arrange: 'O'
    };

    let options = {
        url: 'http://api.visitkorea.or.kr/openapi/service/rest/KorService/searchKeyword',
        dataType: 'JSON',
        method: method,
        data: datas
    };

    return $.ajax(options)
}

function APICallWithGPS(method, obj, pageNum) {
    pageNum = pageNum || 1;

    let datas = {
        ServiceKey: SERVICE_KEY,
        MobileApp: 'TestWeb',
        MobileOS: 'ETC',
        pageNo: pageNum,
        mapX: obj.x,
        mapY: obj.y,
        radius: 1000,
        arrange: 'O'
    };

    let options = {
        url: 'http://api.visitkorea.or.kr/openapi/service/rest/KorService/locationBasedList',
        dataType: 'JSON',
        method: method,
        data: datas
    };

    return $.ajax(options)
}