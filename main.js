
(function () {
  const BASE_URL = 'https://lighthouse-user-api.herokuapp.com'
  const INDEX_URL = '/api/v1/users'  //後面加id即為個人資料
  const allList = document.querySelector('#all-list')
  const likeList = document.querySelector('#like-list .row')
  const userList = document.querySelector('#user-list .row')
  const modalContent = document.querySelector('.modal-content')
  const userImg = document.querySelector('#user-img')
  const userName = document.querySelector('#user-name')
  const userBirthday = document.querySelector('#user-birthday')
  const userEmail = document.querySelector('#user-email')
  const userRegion = document.querySelector('#user-region')
  const searchForm = document.querySelector('#search')
  const searchInput = document.querySelector('.search-input')
  const pagination = document.querySelector('.pagination')
  const selectBtn = document.querySelector('.select-btn')
  const femaleBtn = document.querySelector('.female-btn')
  const maleBtn = document.querySelector('.male-btn')
  const bothGenderBtn = document.querySelector('.bothgender-btn')
  const ageSearchForm = document.querySelector('#age-search')
  const minAgeInput = document.querySelector('.min-age-input')
  const maxAgeInput = document.querySelector('.max-age-input')
  const likeTitle = document.querySelector('.like-title')

  const data = []
  const likeListArray = JSON.parse(localStorage.getItem('myLikeList')) || []  //從localStorage拿資料 || []
  const ITEM_PER_PAGE = 12

  //把年齡搜索資料放searchData，再給性別按鈕使用
  let searchData
  let currentData
  let noHiddenPageNum = 9  //總頁數小於等於8個不隱藏，大於8就隱藏
  let currentPage = 1      //先存成1，之後會根據分頁存成當前頁碼
  let totalPage
  let genderfilter  //性別全域篩選，助教建議

  //request data
  axios.get(BASE_URL + INDEX_URL)
    .then((response) => {
      data.push(...response.data.results)
      getTotalPage(data)
      getPageData(1, data)
      showNowPageActive()
      currentData = data
      searchData = data
    })
    .catch((error) => {
      console.log(error)
    })

  //classify age
  let minAge = 0
  let maxAge = 150
  ageSearchForm.addEventListener('submit', event => {
    event.preventDefault()
    let results = []
    minAge = minAgeInput.value || 0      //若沒輸入就用0
    maxAge = maxAgeInput.value || 150    //若沒輸入就用150
    results = data.filter(user => user.age <= maxAge && user.age >= minAge && user.gender === genderfilter)
    currentPage = 1
    getTotalPage(results)
    getPageData(1, results)
    showNowPageActive()
    // bothGenderBtn.classList.add('btn-active')
    // femaleBtn.classList.remove('btn-active')
    // maleBtn.classList.remove('btn-active')
    currentData = results
    searchData = results
  })

  //classify gender
  selectBtn.addEventListener('click', event => {
    let results
    if (event.target.matches('.female-btn') || event.target.matches('.fa-venus')) {
      femaleBtn.classList.add('btn-active')         //加上class變成active
      maleBtn.classList.remove('btn-active')        //解除active
      bothGenderBtn.classList.remove('btn-active')  //解除active
      results = searchData.filter(user => user.gender === 'female')
      genderfilter = 'female'   //性別全域篩選，助教建議


    } else if (event.target.matches('.male-btn') || event.target.matches('.fa-mars')) {
      maleBtn.classList.add('btn-active')
      femaleBtn.classList.remove('btn-active')
      bothGenderBtn.classList.remove('btn-active')
      results = searchData.filter(user => user.gender === 'male')
      genderfilter = 'male'   //性別全域篩選，助教建議

    } else if (event.target.matches('.bothgender-btn') || event.target.matches('.fa-venus-mars')) {
      bothGenderBtn.classList.add('btn-active')
      femaleBtn.classList.remove('btn-active')
      maleBtn.classList.remove('btn-active')
      results = searchData.filter(user => user.gender === 'female' || 'male')
      genderfilter = 'female' || 'male'  //性別全域篩選，助教建議
    }
    //filter讓search去篩選，才不會動到search的結果
    currentData = results  //讓currentData改變，pagination時才能順利
    currentPage = 1
    getTotalPage(results)
    getPageData(1, results)
    showNowPageActive()
  })


  //不知道為何按這裡的icon會出現TypeError
  //縮小放大like-list
  likeTitle.addEventListener('click', function (event) {
    if (event.target.matches('.fa-minus')) {
      likeTitle.nextElementSibling.classList.add('d-none')
      event.target.classList.add('fa-plus')
      event.target.classList.remove('fa-minus')
    } else if (event.target.matches('.fa-plus')) {
      likeTitle.nextElementSibling.classList.remove('d-none')
      event.target.classList.add('fa-minus')
      event.target.classList.remove('fa-plus')
    }
  })


  //open more information
  allList.addEventListener('click', function (event) {
    if (event.target.matches('.user-avatar')) {
      let id = event.target.dataset.id
      axios.get(BASE_URL + INDEX_URL + '/' + id)
        .then((response) => {
          let user = response.data
          showDataList(user)
        })
        .catch((error) => {
          console.log(error)
        })
    }
  })

  //add and remove DATA of likelist
  //藉由愛心icon所擁有的class判定是否在likeList中，like-active>>在likeList， like-inactive>>不在likeList
  allList.addEventListener('click', function (event) {
    //add to likeList
    //要記得換成number
    let targetId = Number(event.target.parentElement.parentElement.children[0].children[0].dataset.id)

    //按愛心icon有兩種模式
    if (event.target.matches('.fa-heart')) {

      //1.若和likeList重複，則此按鈕作用變成移出likeList
      if (likeListArray.some(user => user.id === targetId)) {
        removeLikeListItem(targetId)

        //2.若和likeList不重複，此按鈕作用為加入likeList  
      } else {
        event.target.classList.add('like-active')  //換成紅愛心
        const likeUserData = data.find(user => user.id === targetId)
        likeListArray.push(likeUserData)       //放入上面已經宣告的變數中
        localStorage.setItem('myLikeList', JSON.stringify(likeListArray))  //放回localStorage
        displayDataList(likeListArray, likeList)                          //在likeList顯示資料
      }

      //按叉叉icon把item刪除，同時也消去userList的紅愛心
    } else if (event.target.matches('.fa-times')) {
      removeLikeListItem(targetId)
    }

  })

  //click page to get data
  //藉由data-page得到頁碼，並存到外層已經宣告的變數中，再把值傳給getPageData
  //注意：要把currentPage要轉成數字，不然跑中間頁碼的currentPage +2 時會錯誤orz
  pagination.addEventListener('click', event => {
    if (event.target.tagName === 'A') {
      //下一頁，限制在小於最終頁的頁碼才能按
      if (event.target.matches('.next-link')) {
        if (currentPage < totalPage) {
          currentPage += 1
        } else {
          alert(`You are at last page now!!`)
        }
        //上一頁，限制在大於第1頁的頁碼才能按
      } else if (event.target.matches('.previous-link')) {
        if (currentPage > 1) {
          currentPage -= 1
        } else {
          alert(`You are at first page now!!`)
        }
        //直接按數字
      } else {
        currentPage = Number(event.target.dataset.page)
      }

      getTotalPage(currentData)  //每次按分頁都會讓getTotalPage跑一次，才能改變分頁列形式
      getPageData(currentPage, currentData)
      showNowPageActive()
    }
  })




  /////////////////function//////////////////////


  //讓當前頁變成active和disabled的狀態 (改背景色和無法點擊)  
  //若要改CSS，要很多class一起才能改...詳情看css那列
  function showNowPageActive() {
    for (let li of pagination.children) {
      if (li.firstElementChild.dataset.page === currentPage.toString()) {
        li.classList.add('active', 'disabled')
      }
    }
  }



  //remove from likeList
  function removeLikeListItem(id) {
    //藉由index找到在lileListArray的位置，再刪去
    const removeUserIndex = likeListArray.findIndex(user => user.id === Number(id))
    likeListArray.splice(removeUserIndex, 1)
    localStorage.setItem('myLikeList', JSON.stringify(likeListArray))  //將結果存回localStorage
    displayDataList(likeListArray, likeList)   //重新跑一次LikeList
    getPageData(currentPage, data)   //讓userList重跑一次，才能把紅色愛心消掉
  }

  //calculate number of pages
  function getTotalPage(data) {
    totalPage = Math.ceil(data.length / ITEM_PER_PAGE)
    let htmlContent = ''
    //如果總頁數小於等於7個，則不需要隱藏頁數，直接顯示網頁
    if (totalPage <= noHiddenPageNum) {
      htmlContent += `
            <li class="page-item">
              <a class="page-link previous-link" href="#">&laquo;</a>
            </li>`
      for (let i = 0; i < totalPage; i++) {
        htmlContent += `
           <li class="page-item">
             <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
           </li>`
      }
      htmlContent += `
            <li class="page-item">
               <a class="page-link next-link" href="#">&raquo;</a>
            </li>`
      pagination.innerHTML = htmlContent

      //如果總頁數大於7個，則隱藏部分頁數  
    } else {
      //若當前頁碼在1.2.3頁，則會直接顯示1-6頁，後面則是「...」和最終頁
      if (currentPage < 4) {
        htmlContent += `
            <li class="page-item">
              <a class="page-link previous-link" href="#">&laquo;</a>
            </li>`
        for (let i = 0; i < 6; i++) {
          htmlContent += `
             <li class="page-item">
               <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
             </li>`
        }
        //在<li>加上disabled使之不能被按
        htmlContent += `
             <li class="page-item disabled">  
               <a class="page-link">...</a>
             </li>
             <li class="page-item">
               <a class="page-link" href="#" data-page="${totalPage}">${totalPage}</a>
             </li>
            <li class="page-item">
               <a class="page-link next-link" href="#">&raquo;</a>
            </li>`
        //中間頁的情況，只顯示當前頁的前後兩頁、第一頁和最終頁
      } else if (4 <= currentPage && currentPage <= totalPage - 5) {
        htmlContent += `
             <li class="page-item">
               <a class="page-link previous-link" href="#">&laquo;</a>
             </li>
             <li class="page-item">
               <a class="page-link" href="#" data-page="1">1</a>
             </li>
             <li class="page-item disabled">  
               <a class="page-link">...</a>
             </li>`
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          htmlContent += `
             <li class="page-item">
               <a class="page-link" href="#" data-page="${i}">${i}</a>
             </li>`
        }
        htmlContent += `
             <li class="page-item disabled">  
               <a class="page-link">...</a>
             </li>
             <li class="page-item">
               <a class="page-link" href="#" data-page="${totalPage}">${totalPage}</a>
             </li>
             <li class="page-item next-link">
               <a class="page-link next-link" href="#">&raquo;</a>
            </li>`
        //在最後幾頁的情況，即當前頁大於13頁時的情況
      } else {
        htmlContent += `
             <li class="page-item">
               <a class="page-link previous-link" href="#">&laquo;</a>
             </li>
             <li class="page-item">
               <a class="page-link" href="#" data-page="1">1</a>
             </li>
             <li class="page-item disabled">  
               <a class="page-link">...</a>
             </li>`
        for (let i = totalPage - 5; i <= totalPage; i++) {
          htmlContent += `
             <li class="page-item">
               <a class="page-link" href="#" data-page="${i}">${i}</a>
             </li>`
        }
        htmlContent += `
            <li class="page-item">
               <a class="page-link next-link" href="#">&raquo;</a>
            </li>`
      }
      pagination.innerHTML = htmlContent
    }
  }

  //data of per page
  let paginationData = []
  function getPageData(pageNum, data) {
    paginationData = data || paginationData
    let offset = (pageNum - 1) * ITEM_PER_PAGE   //0-11 12-23 24-35...
    let pageData = paginationData.slice(offset, offset + ITEM_PER_PAGE)
    displayDataList(pageData, userList)
    displayDataList(likeListArray, likeList)   //同時使likeList顯示card

    //在換分頁時，替已在likeList的人補上紅色愛心 
    //比對pageData中是否有likeListArray相同的id
    for (let likeUser of likeListArray) {
      if (pageData.some(user => user.id === Number(likeUser.id))) {  //如果不加這行，換頁會一直出現TypeError
        let LikeDataInUser = pageData.findIndex(user => user.id === Number(likeUser.id))
        userList.children[LikeDataInUser].children[1].classList.add('like-active')
      }
    }
  }


  //more imformation HTML
  function showDataList(user) {
    const modalContent = document.querySelector('.modal-content')
    modalContent.innerHTML = `
        <div class="row p-2">
          <div id="user-img" class="col-6">
            <img class="rounded" src=${user.avatar} alt="img">
          </div>
          <div class="col-6">
            <h5 id="user-name" class="mt-3">${user.name} ${user.surname} (${user.age}) <i class="fa fa-${user.gender}"></i></h5>
            <hr>
            <div class="info pt-3 pl-2">
              <p id="user-birthday"><i class="fas fa-birthday-cake"></i> ${user.birthday}</p>
              <p id="user-email"><i class="fas fa-envelope"></i> ${user.email}</p>
              <p id="user-region"><i class="fas fa-map-marker-alt"></i> ${user.region}</p>
            </div>
          </div>
        </div>`

    // userImg.innerHTML = `<img class="rounded" src=${user.avatar} alt="img">`
    // userName.innerHTML = `${user.name} ${user.surname} (${user.age})  <i class="fa fa-${user.gender}"></i>`
    // userBirthday.innerHTML = `<i class="mr-2 fa fa-birthday-cake"></i>${user.birthday}`
    // userEmail.innerHTML = `<i class="mr-2 fa fa-envelope"></i>${user.email}`
    // userRegion.innerHTML = `<i class="mr-2 fa fa-map-marked-alt"></i>${user.region}`
  }



  //card HTML    
  function displayDataList(data, list) {
    let htmlContent = ''
    //如果沒data就出現no data
    if (data.length === 0) {
      list.innerHTML = `<p class="no-data">NO DATA</p>`
      //如果有data，就出現card
    } else {
      if (list.parentElement.matches('#user-list')) {
        for (let item of data) {
          htmlContent += `
            <div class="user card">
              <div style="width: 12rem;">
                <img class="user-avatar card-img-top rounded-circle" src=${item.avatar} alt="image" data-target="#userModal" data-toggle="modal" data-id="${item.id}">
                <div class="card-body">
                  <p class="card-text text-center">${item.name} ${item.surname}  <i class="fa fa-${item.gender}"></i></p>
                </div>
              </div>
              <div class="like-btn"><i class="fa fa-heart"></i></div>
            </div>`
        }

        //如果是likeList 則換掉icon的className
      } else if (list.parentElement.parentElement.matches('#like-list')) {
        for (let item of data) {
          htmlContent += `
              <div class="user card">
                <div style="width: 12rem;">
                  <img class="user-avatar card-img-top rounded-circle" src=${item.avatar} alt="image" data-target="#userModal" data-toggle="modal" data-id="${item.id}">
                  <div class="card-body">
                    <p class="card-text text-center">${item.name} ${item.surname}  <i class="fa fa-${item.gender}"></i></p>
                  </div>
                </div>
                <div class="like-btn"><i class="fa fa-times"></i></div>
              </div>`
        }
      }

      list.innerHTML = htmlContent
    }
  }
})()