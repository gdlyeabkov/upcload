<template>
  <div id="app">
    <p style="cursor: pointer; font-size: 24px; color: rgb(215, 215, 215)" @click="previousFolder()">..</p>
    <p style="font-size: 24px; color: rgb(215, 215, 215)">{{ path }}</p>
    <div v-if="allFiles !== null && allFiles.length !== 0">
      <div v-for="file in allFiles">
        <input data-selected="false" type="hidden" :value="file._id">
        <div @dblclick="changePath(file.name, file.type)" @click="expandSelect($event)" class="card" style="cursor: pointer; float: left; margin: 5px;">
          <h5 class="card-header">
            <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" />
            <p>{{ Math.floor(file.size / 1024) }} Кб</p>
          </h5>
          <div class="card-body" style="min-height: 125px;">
            <div v-if="file.type.includes('group')" style="display: inline;">
              <span class="material-icons">
                folder
              </span>
            </div>
            <div v-else-if="file.type.includes('mp4')" style="display: inline;">
              <span class="material-icons">
                movie
              </span>
            </div>
            <div v-else-if="file.type.includes('img')" style="display: inline;">
            <span class="material-icons">
              image
            </span>
            </div>
            <div v-else-if="file.type.includes('mp3')" style="display: inline;">
              <span class="material-icons">
                headphones
              </span>
            </div>
            <h5 class="card-title" style="display: inline;">{{ file.name }}</h5>
            <p class="card-text">Последний раз обновлен {{ new Date().toLocaleDateString() }}.</p>
          </div> 
        </div>
      </div>
    </div>
    <div v-else-if="allFiles !== null && allFiles.length === 0">
      <p style="text-align: center; font-size: 24px; color: rgb(215, 215, 215)">Вы не загрузили ещё ни 1 файл.</p>
    </div>
    <br style="clear: both;"/>
    <form class="formOfUploadedFiles" enctype="multipart/form-data"  method="POST" :action="`http://localhost:4000/files/upload/?filepath=${path}`">
      <input style="display: none;" id="filename" type="text" name="name" />
      <input style="display: none;" id="filesize" type="number" name="size" />
      <input style="display: none;" id="filetype" type="text" name="type" />
      <label for="fileuploader" style="cursor: pointer; font-size: 124px; position: fixed; top: calc(100% - 25%); left: calc(100% - 15%);" class="material-icons cloud" ref="cloud">
        cloud_upload
      </label>
      <input accept="image/png, audio/mpeg, video/mp4" name="myFiles" ref="fileUploader" @change="uploadFiles($event)" style="display: none;" id="fileuploader" type="file" multiple />
    </form>
    <p class="mt-5 mb-3 text-muted">© {{ new Date().toLocaleDateString() }}</p> 
    <div @drop.prevent="drop_handler($event)" @dragover="dragover_handler($event)" @click="clearSelection($event)" class="workSpace" style="width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: red; z-index: -5;"></div>
    <div class="createFolderModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert" style="min-width: 550px;">
        <span @click="closeModal($event)" style=" font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        <input v-model="folderName" style="max-width: 200px; margin: auto;" type="text" class="form-control" id="folderName" aria-describedby="folderName">
        <button style="margin: auto;" @click="createFolder()" class="btn btn-primary" type="button">Создать папку</button>
      </div>
    </div>
    <div class="fileModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert">
        <span @click="closeModal($event)" style=" font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        A simple primary alert with <a href="#" class="alert-link">an example link</a>. Give it a click if you like.
      </div>
    </div>
    <div class="fileLinkModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert">
        <span @click="closeModal($event)" style=" font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        Сгенерировать ссылку<br/>
        <a type="text" href="https://google.com">https://google.com</a>
      </div>
    </div>
    <div class="filePropsModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert">
        <span @click="closeModal($event)" style=" font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        <p>Размер файла: 256 Гб</p>
        <p>Последний раз обновлен {{ new Date().toLocaleDateString() }}.</p>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Home',
  data(){
    return {
      allFiles: [],
      selection: [],
      contextWindow: null,
      menuItems: [
        "Открыть",
        "Создать папку",
        "Удалить",
        "Сделать ссылкой",
        "Скачать",
        "Свойства"
      ],
      path: "root/",
      folderName: ''
    }
  },
  mounted(){
    if(this.$route.query.path !== null && this.$route.query.path !== undefined){
      this.path = this.$route.query.path
    } else {
      this.path = 'root'
    }
    
    fetch(`http://localhost:4000/home/`, {
      mode: 'cors',
      method: 'GET'
    }).then(response => response.body).then(rb  => {
        const reader = rb.getReader()
        return new ReadableStream({
        start(controller) {
            function push() {
            reader.read().then( ({done, value}) => {
                if (done) {
                    console.log('done', done);
                    controller.close();
                    return;
                }
                controller.enqueue(value);
                console.log(done, value);
                push();
            })
            }
            push();
        }
        });
    }).then(stream => {
        return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
    })
    .then(result => {
        console.log(JSON.parse(result))
        this.allFiles = JSON.parse(result).allFiles.filter(file => {
          if(this.$route.query.path !== null && this.$route.query.path !== undefined){
            if(file.path === this.$route.query.path){
              return true
            }
            return false
          } else if(this.$route.query.path === null || this.$route.query.path === undefined){
            if('root' === file.path){
              return true
            }
            return false
          }
        })
    });
  },
  methods: {
    previousFolder(){
      let previousDir = this.path.split('/')
      previousDir.pop()
      this.$router.push({ name: 'Home', query: { path: previousDir.join('/') } })
      window.location.reload()
    },
    createFolder(){
      fetch(`http://localhost:4000/files/createfolder/?filename=${this.folderName}&filepath=${this.path}`, {
        mode: 'cors',
        method: 'GET'
      }).then(response => response.body).then(rb  => {
          const reader = rb.getReader()
          return new ReadableStream({
          start(controller) {
              function push() {
              reader.read().then( ({done, value}) => {
                  if (done) {
                      console.log('done', done);
                      controller.close();
                      return;
                  }
                  controller.enqueue(value);
                  console.log(done, value);
                  push();
              })
              }
              push();
          }
          });
        }).then(stream => {
            return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
        })
        .then(result => {
          console.log(JSON.parse(result))
          document.querySelector('.createFolderModal').style.display = `none`
          window.location.reload()
        });
    },
    changePath(folderName, fileType){
      if(fileType.includes("group")){
        this.$router.push({ name: 'Home', query:{ path: `${this.path}/${folderName}` } })
        window.location.reload()
      }
    },
    uploadFiles(event) {
      // action="http://localhost:8080/files/upload/?filename=group&filetype=group&filesize=256"
      if(event.target.files[0].type.includes("img")){
          fileType = "img"
      } else if(event.target.files[0].type.includes("mp4")){
          fileType = "mp4"
      } else if(event.target.files[0].type.includes("mp3")){
          fileType = "mp3"
      }
      document.querySelector('.formOfUploadedFiles').method = "POST"
      // document.querySelector('.formOfUploadedFiles').action = `http://localhost:8080/files/upload/?filename=${event.target.files[0].name}&filetype=${fileType}&filesize=${event.target.files[0].size}`
      // document.querySelector('.formOfUploadedFiles').setAttribute("action", `http://localhost:8080/files/upload/?filename=${event.target.files[0].name}&filetype=${fileType}&filesize=${event.target.files[0].size}`)
      document.querySelector('.formOfUploadedFiles').submit()
    },
    closeModal(event){
      event.target.parentNode.parentNode.style.display = "none"
    },
    clearSelection(event) {
      this.selection = []
      document.querySelectorAll('.card-header').forEach(element => {
        element.parentNode.previousElementSibling.setAttribute('data-selected', "false")
        element.parentNode.classList -= `text-white bg-info`
        element.parentNode.classList += ` card`
      })
      try{
          document.querySelector('.contextMenu').remove()
      } catch(e) {
          console.log('не могу удалить, потому что не существует окно')
      }
      console.log("selection: ", this.selection)
    },
    dragover_handler(event){
      event.preventDefault()
      this.$refs.cloud.style.fontSize = '256px'
      this.$refs.cloud.style.top = 'calc(100% - 35%)'
      this.$refs.cloud.style.left = 'calc(100% - 25%)'
    },
    drop_handler(event){
      this.$refs.cloud.style.fontSize = '124px'
      this.$refs.cloud.style.top = 'calc(100% - 25%)'
      this.$refs.cloud.style.left = 'calc(100% - 15%)'
      this.$refs.fileUploader.files = event.dataTransfer.files
      document.querySelector('.formOfUploadedFiles').method = "POST"
      document.querySelector('.formOfUploadedFiles').submit()
    },
    expandSelect(event){
      if(!event.shiftKey){
        if(event.target.parentNode.previousElementSibling.getAttribute('data-selected').includes("false")){
          //добавляем выделение
          if((event.target.parentNode.previousElementSibling.getAttribute('data-selected').includes("false") && !event.ctrlKey)){
            for(let card of document.querySelectorAll('.card-body')){
              card.parentNode.classList -= ` text-white bg-info`
              card.parentNode.classList += ` card`
              card.parentNode.previousElementSibling.setAttribute('data-selected', "false")
            }
            this.selection = []
          }
          event.target.parentNode.classList += ` text-white bg-info`
          event.target.parentNode.style = `margin: 5px; border: 1px solid rgb(190, 190, 190); display: inline-block; border-radius: 5px; float: left;`
          event.target.parentNode.previousElementSibling.setAttribute('data-selected', "true")
          this.selection.push(event.target.parentNode.previousElementSibling.value)
        } else if(event.target.parentNode.previousElementSibling.getAttribute('data-selected').includes("true")){
          
          //вычитаем выделение
          event.target.parentNode.classList -= ` text-white bg-info`
          event.target.parentNode.classList += ` card`
          event.target.parentNode.previousElementSibling.setAttribute('data-selected', "false")
          //selection.pop(event.target.parentNode.previousElementSibling.value)
          
          let counter = 0
          this.selection.splice(this.selection.findIndex((el, idx, arr) => {
          
          counter++
          if(counter === 1 && event.target.parentNode.previousElementSibling.value === el){
              return true
          }
          return false
            
        }), 1)
    }
    try{
        document.querySelector('.contextMenu').remove()
    } catch(e) {
        console.log('не могу удалить, потому что не существует окно')
    }
    console.log('selection: ', this.selection)
  } else if(event.shiftKey){
    try{
      document.querySelector('.contextMenu').remove()
    } catch(e) {
      console.log('не могу удалить, потому что не существует окно')
    }
    if(this.selection.length >= 1){
      this.contextWindow = document.createElement("div")
      this.contextWindow.classList += "contextMenu"
      this.contextWindow.style = `
        min-width: 285px;
        min-height: 250px;
        background-color: rgb(245, 245, 245);
        border: 1px solid rgb(125, 125, 125);
        position: absolute;
        top: ${event.y}px;
        left: ${event.x}px;
        box-sizing: border-box;
        padding: 15px;
      `
      for(let menuItem of this.menuItems){
                let menuItemTool = document.createElement("p")
                menuItemTool.innerHTML = menuItem
                menuItemTool.style = `
                    cursor: pointer;
                `
                
                menuItemTool.addEventListener("click", function(event){
                    console.log('event.target: ', event.target.textContent)
                    if(event.target.textContent.includes("Открыть")){
                      document.querySelector('.fileModal').style.display = `flex`
                    } else if(event.target.textContent.includes("Создать папку")){
                      document.querySelector('.createFolderModal').style.display = `flex`
                    } else if(event.target.textContent.includes("Открыть")){

                    } else if(event.target.textContent.includes("Удалить")){

                    } else if(event.target.textContent.includes("Скачать")){
                        download(event, "efj")
                    } else if(event.target.textContent.includes("Сделать ссылкой")){
                        document.querySelector('.fileLinkModal').style.display = `flex`
                        fetch(`http://localhost:4000/files/generatelink/?fileid=${this.selection[0]}`, {
                          mode: 'cors',
                          method: 'GET'
                        }).then(response => response.body).then(rb  => {
                            const reader = rb.getReader()
                            return new ReadableStream({
                            start(controller) {
                                function push() {
                                reader.read().then( ({done, value}) => {
                                    if (done) {
                                        console.log('done', done);
                                        controller.close();
                                        return;
                                    }
                                    controller.enqueue(value);
                                    console.log(done, value);
                                    push();
                                })
                                }
                                push();
                            }
                            });
                        }).then(stream => {
                            return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
                        })
                        .then(result => {
                            console.log(JSON.parse(result))
                            this.allFiles = JSON.parse(result).allFiles
                        });
                    } else if(event.target.textContent.includes("Свойства")){
                        document.querySelector('.filePropsModal').style.display = `flex`
                    }

                })
                this.contextWindow.appendChild(menuItemTool)
            }
            document.body.appendChild(this.contextWindow)
          }
        }
    }
  }  
}

function drop_handler(event){
  event.preventDefault()
  console.log("drop_handler")
  console.log("event: ", this.$event)
  console.log("event.dataTransfer.items: ", this.$event.dataTransfer.items)
  console.log("event.dataTransfer: ", this.$event.dataTransfer)
  document.querySelector('.formOfUploadedFiles').method = "POST"
  document.querySelector('.formOfUploadedFiles').submit()
}
</script>
