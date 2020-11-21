var map = null;
var defaultLat = 37.585648;
var defaultLng = 127.097113;
var open = false;
var resultItems = [];
var infoWindows = [];
var markers = [];
var opens = [];

window.onload = () => {
    // map
    Kakao.init('95a538b1665e5578341337b679379a9c')

    addMap();
    gps();

    // dom
    addSideBarEvent();
    addSearchEvent();
}

// map
function addMap() {
    let mapEle = $('#map').get(0);

    let options = {
        center: new kakao.maps.LatLng(defaultLat, defaultLng),
        level: 3  
    };

    map = new kakao.maps.Map(mapEle, options);

    let mapTypeControl = new kakao.maps.MapTypeControl();
    map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

    let zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
}

// gps
function gps() {
    let options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: Infinity
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            let lat = position.coords.latitude
            let lng = position.coords.longitude
            
            map.panTo(new kakao.maps.LatLng(lat, lng));
            callAPIWithGPS(lat, lng);
        }, (err) => {
            map.panTo(defaultLat, defaultLng);
            callAPIWithGPS(defaultLat, defaultLng);
        }, options);
    } else {
        map.panTo(defaultLat, defaultLng);
        callAPIWithGPS(defaultLat, defaultLng);
    }
}

// marker 추가
function addMarker(lat, lng) {
    let latLng = new kakao.maps.LatLng(lat, lng)

    let marker = new kakao.maps.Marker({
        position: latLng
    });

    marker.setMap(map);
    markers.push(marker);
    opens.push(false);

    kakao.maps.event.addListener(marker, 'click', () => {
        markers.forEach((e, i) => {
            if (marker.xd.id === e.xd.id) {
                if (!opens[i]) infoWindows[i].open(map, e);
                else infoWindows[i].close();

                opens[i] = !opens[i];
            }
        });
    });
}

// infoWindow 추가
function addInfoWindows() {
    if (resultItems.item === undefined) return;

    if (!resultItems.item.length) {
        let content = `<div class="info-window">${resultItems.item.title}</div>`;

        let infoWindow = new kakao.maps.InfoWindow({
            map: map,
            position: new kakao.maps.LatLng(resultItems.item.mapy, resultItems.item.mapx),
            content: content
        });

        infoWindows.push(infoWindow);
        infoWindow.close();
    } else {
        resultItems.item.forEach((e) => {
            let content = `<div class="info-window">${e.title}</div>`;

            let infoWindow = new kakao.maps.InfoWindow({
                map: map,
                position: new kakao.maps.LatLng(e.mapy, e.mapx),
                content: content
            });

            infoWindows.push(infoWindow);
            infoWindow.close();
        });
    }
}

// marker, infoWindow 삭제
function delMarkerAndInfoWindow() {
    markers.forEach((e, i) => {
        e.setMap(null);
    });

    infoWindows.forEach((e, i) => {
        e.close();
    });
}

// arrow click Event
function addSideBarEvent() {
    let arrowEle = $('.arrow').get(0);

    arrowEle.addEventListener('click', arrowOnClick);
}

// animation Event
function arrowOnClick() {
    let sideBarEle = $('.sidebar__container').get(0);
    let rotateEle = $('.rotateEvent');

    if (open) {
        sideBarEle.classList.remove('open')
        sideBarEle.classList.add('close')
        rotateEle.css('transform', 'rotate(0deg)');
    } else  {
        sideBarEle.classList.remove('close')
        sideBarEle.classList.add('open')
        rotateEle.css('transform', 'rotate(180deg)');
    }

    open = !open;
}

// keyboard Event
function addSearchEvent() {
    let searchEle = $('.search').get(0);

    // keydown은 입력한 거에 한 글자씩 밀림
    // debounce 연속적으로 발생하는 이벤트를 1초마다 발생하게 바꿔줌 (API를 최소한으로 부르기 위함)
    // API를 연속적으로 계속 부르게 된다면 요청량도 많아질 뿐더러, 여러 요청인해 한 요청의 시간이 길어지면 다음 요청을 수행 못함
    searchEle.addEventListener('keyup', _.debounce((event) => {
        if (event.keyCode === 13) return;

        keyboardEvent(event.target.value);
    }, 200));

    searchEle.addEventListener('focus', (event) => {
        keyboardEvent(event.target.value)
    });

    searchEle.addEventListener('keydown', callAPIKeyboardWithKeyword);
}

function keyboardEvent(keyword) {
    // 검색 키워드가 없을 시 나가기
    if (keyword === "") {
        emptyItems();
        return;
    }

    callAPIWithKeyword(keyword);
}

// 키워드가 없을 시 연관검색창 끄기
function emptyItems() {
    removeItemsEvent();
    $('.search-items').eq(0).html('');
}

// 이벤트 삭제
function removeItemsEvent() {
    let items = $('.search-items');

    if (!items) return;

    $.each(items, (index, item) => {
        item.removeEventListener('click', callAPIClickWithKeyword);
    });
}

// keyword 검색
async function callAPIWithKeyword(keyword) {
    let result = await APICallWithKeyword('get', keyword);
    let items = "";
    let itemArray = [];
    resultItems = [];
    markers = [];
    infoWindows = [];
    opens = [];

    // 연관검색창 내용 없애기
    emptyItems();

    if (result.response.header.resultCode = "0000") {
        items = result.response.body.items;
        resultItems = items;

        // response 값에서 items이 없을 때는 ""로 넘어옴
        if (items !== "") {
            if (!items.item.length) {
                itemArray.push(`<li class="search-item">${items.item.title}</li>`);
            } else {
                items.item.forEach((e) => {
                    itemArray.push(`<li class="search-item">${e.title}</li>`);
                });
            }
        }
    } else {
        console.log('오류가 발생하였습니다.');
    }

    $('.search-items').eq(0).html(itemArray.join(''));
    addItemsEvent();

    $('.search-box__items').get(0).classList.remove('none');

    // 다른 곳을 누를 시 연관검색창을 없애는 이벤트
    $('body').get(0).addEventListener('click', removeClassAndEvent);
}

// search item add event
function addItemsEvent() {
    let items = $('.search-items');

    $.each(items, (index, item) => {
        item.addEventListener('click', clickSearchItem);
    });
}

// search item click event
function clickSearchItem(event) {
    let keyword = event.target.textContent

    if (keyword === "") return;

    callAPIClickWithKeyword(keyword, true);
}

// item 클릭 검색
async function callAPIClickWithKeyword(keyword, delItem) {
    delItem = delItem || false

    // 연관검색창 삭제
    removeClassAndEvent();
    delMarkerAndInfoWindow();

    let result = await APICallWithKeyword('get', keyword);
    let items = [];
    resultItems = [];
    markers = [];
    infoWindows = [];
    opens = [];

    if (delItem) $('.sidebar__list').eq(0).html('');

    if (result.response.header.resultCode = "0000") {
        items = result.response.body.items;
        resultItems = items;

        // response 값에서 items이 없을 때는 ""로 넘어옴
        if (items !== "") {
            if (delItem) addElement(items.item);

            // x y 좌표
            let lat = items.item.mapy
            let lng = items.item.mapx

            console.log(lat, lng);
            map.panTo(new kakao.maps.LatLng(lat, lng));
            addMarker(lat, lng);
        }
    } else {
        console.log('Err!');
    }

    addInfoWindows();
}

// enter 키 입력 검색
async function callAPIKeyboardWithKeyword(event) {
    // 연관검색창 삭제
    removeClassAndEvent();
    delMarkerAndInfoWindow();

    let keyword = event.target.value

    if (event.keyCode !== 13) return;
    else if (keyword === "") return;

    let result = await APICallWithKeyword('get', keyword);
    let items = [];
    resultItems = [];
    markers = [];
    infoWindows = [];
    opens = [];

    $('.sidebar__list').eq(0).html('');

    if (result.response.header.resultCode = "0000") {
        items = result.response.body.items;
        resultItems = items;

        // response 값에서 items이 없을 때는 ""로 넘어옴
        if (items !== "") {
            if (!items.item.length) {
                addElement(items.item);
            } else {
                items.item.forEach((e) => {
                    addElement(e);
                });
            }
        }
    } else {
        console.log('오류가 발생하였습니다.');
    }
}

// gps 검색
async function callAPIWithGPS(lat, lng) {
    let obj = {
        x: lng,
        y: lat
    }
    let result = await APICallWithGPS('get', obj);
    let items = [];
    resultItems = [];
    markers = [];
    infoWindows = [];
    opens = [];

    $('.sidebar__list').eq(0).html('');
    delMarkerAndInfoWindow();

    if (result.response.header.resultCode = "0000") {
        items = result.response.body.items;
        resultItems = items;

        // response 값에서 items이 없을 때는 ""로 넘어옴
        if (items !== "") {
            if (!items.item.length) {
                addElement(items.item);
                addMarker(items.item.mapy, items.item.mapx);
            } else {
                items.item.forEach((e) => {
                    addElement(e);
                    addMarker(e.mapy, e.mapx);
                });
            }
        }
    } else {
        console.log('오류가 발생하였습니다.');
    }

    addInfoWindows();
}

// 연관검색창 숨김 및 이벤트 삭제
function removeClassAndEvent() {
    $('.search-box__items').get(0).classList.add('none');
    $('body').get(0).removeEventListener('click', removeClassAndEvent);
}

// 연관검색창 자식 요소 추가
function addElement(e) {
    // container Element
    let itemContainerEle = document.createElement('li');
    itemContainerEle.classList.add('sidebar__list-item');

    // img-box Element
    let imgBoxEle = document.createElement('div');
    imgBoxEle.classList.add('img-box');
    
    let imgEle = document.createElement('img');
    imgEle.classList.add('img');
    imgEle.src = e.firstimage2;

    imgBoxEle.appendChild(imgEle);

    // content-box Element
    let contentBoxEle = document.createElement('div');
    contentBoxEle.classList.add('content-box');

    if (e.title !== undefined) {
        let titleEle = document.createElement('div');
        titleEle.classList.add('title');
        titleEle.innerHTML = e.title;

        contentBoxEle.appendChild(titleEle);
    }

    if (e.addr1 !== undefined) {
        let addressEle = document.createElement('div');
        addressEle.classList.add('address');
        addressEle.innerHTML = e.addr1;

        contentBoxEle.appendChild(addressEle);
    }

    if (e.tel !== undefined) {
        let telEle = document.createElement('div');
        telEle.classList.add('tel');
        telEle.innerHTML = e.tel;

        contentBoxEle.appendChild(telEle);
    }

    itemContainerEle.appendChild(imgBoxEle);
    itemContainerEle.appendChild(contentBoxEle);

    let containerEle = document.getElementsByClassName('sidebar__list')[0];
    containerEle.appendChild(itemContainerEle);

    contentBoxEle.addEventListener('click', clickItem);
}

// 연관검색창 아이템 클릭
function clickItem(event) {
    let keyword = ""

    // title class 찾아가기
    event.path.forEach((e) => {
        if (e.className === "content-box") {
            keyword = e.childNodes[0].textContent;
        }
    });

    if (keyword === "") return;

    callAPIClickWithKeyword(keyword);
}