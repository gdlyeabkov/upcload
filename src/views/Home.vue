<template>
  <div class="app">
    <div class="componentHeight">
      <Header :auth="true" :user="useremail"/>
      <div style="width: 75%; position: relative; top: 0px; left: 0px; z-index: 2; display: flex; justify-content: center; margin: 15px auto;">
        <input type="search" id="inputPassword5" class="form-control" aria-describedby="searchHelpBlock" placeholder="Найдите своё..." v-model="searchkwrds" />
        <span style="cursor:pointer; margin: 10px;" class="btn btn-danger material-icons" @click="searchFiles()">
          search
        </span>
      </div>
      <div style="width: 100%;">
        <div class="freeSpacePanel" style="position: relative; top: 0px; left: 0px; z-index: 2; width: 100%;">
          <div ref="freeSpacePanel" class="card" style="border-radius: 25px; cursor: pointer; margin: 5px; height: 200px; width: 75%; float: right;">
            <h5 class="card-header" style="overflow: hidden;">
              <h4 style="position: relative; top: 0px; left: 0px; z-index: 2;">Место на диске: </h4>
            </h5>
            <div class="card-body" style="min-height: 125px;">
              <h5 style="text-align: right; position: relative; top: 0px; left: 0px; z-index: 2;">{{ computeSize(user.size) }}{{ computeMeasure(user.size, 0) }}/4Мб</h5>
              <div class="progress">
                <div :class="`progress-bar bg-${levelOfFreeSpace}`" ref="progressbar" role="progressbar" style="width: 25%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div> 
          </div>
        </div>  
      </div>
      <br style="clear: both;"/>
      <div ref="filePanelList" class="filePanel" style="width: 100%; height: 100%;">
        <p v-if="path !== 'root'" style="margin-left: 35px; display: inline; cursor: pointer; font-size: 24px; color: rgb(165, 165, 165); font-weight: bold; position: relative; top: 0px; left: 0px; z-index: 2;" @click="previousFolder()">..</p>&nbsp;
        <p style="display: inline; font-size: 24px; color: rgb(165, 165, 165); position: relative; top: 0px; left: 0px; z-index: 2;">{{ path }}</p>
        <div v-if="allFiles !== null && allFiles.length !== 0">
          <div style="position: relative; top: 0px; left: 0px; z-index: 2;" v-for="file in allFiles" :key="file.name">
            <input data-selected="false" type="hidden" :value="file._id">
            <div @contextmenu="expandSelect($event, file.name, 'right')" @dblclick="changePath($event, file.name, file.type)" @click="expandSelect($event, file.name, 'left')" class="card" style="cursor: pointer; float: left; margin: 5px; width: 275px;  height: 250px;">
              <h5 class="my-card-header card-header" style="overflow: hidden;">
                <p style="">{{ computeSize(file.size) }} {{ computeMeasure(file.size, 0) }}</p>
                <div v-if="file.type.includes('img')">
                  <img :src="`${baseUrl}/files/getpreview?previewname=${file.name}&filetype=${file.type}&useremail=${useremail}`"  @error="$event.target.src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" style="width: 100%; height: 100%;">
                </div>
                <div v-else-if="file.type.includes('mp4')">
                  <video autoplay loop style="width: 100%; height: 100%;" controls>
                    <source :src="`${baseUrl}/files/getpreview?previewname=${file.name}&filetype=${file.type}&useremail=${useremail}`"/>
                  </video>
                </div>
                <div v-else-if="file.type.includes('mp3')">
                  <audio :src="`${baseUrl}/files/getpreview?previewname=${file.name}&filetype=${file.type}&useremail=${useremail}`" controls></audio>
                </div>
              </h5>
              <div class="my-card-body" style="min-height: 125px;">
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
                <div v-if="file !== null && file !== undefined">
                  <p class="card-text">Последний раз обновлен {{ file.updated.toLocaleString() }}.</p>
                </div>
              </div> 
            </div>
          </div>
        </div>
        <div v-else-if="allFiles !== null && allFiles.length === 0">
          <p @contextmenu="expandSelect($event, 'mockFileName', 'right')" style="position:relative; top: 0px;  left: 0px; z-index: 2; cursor: pointer; text-align: center; font-size: 24px; color: rgb(215, 215, 215)">Вы не загрузили ещё ни 1 файл.</p>
        </div>
        <br style="clear: both;"/>
      </div>
      <br style="clear: both;"/>
      <form class="formOfUploadedFiles" enctype="multipart/form-data"  method="POST" :action="`${baseUrl}/files/upload/?filepath=${path}&owner=${useremail}`">
        <input style="display: none;" id="filename" type="text" name="name" />
        <input style="display: none;" id="filesize" type="number" name="size" />
        <input style="display: none;" id="filetype" type="text" name="type" />
        <label for="fileuploader" style="z-index: 15; cursor: pointer; font-size: 124px; position: fixed; top: calc(100% - 25%); left: calc(100% - 15%);" class="material-icons cloud" ref="cloud">
          cloud_upload
        </label>
        <input accept=".png" name="myFiles" ref="fileUploader" @click.prevent="openpanel()" style="display: none;" id="fileuploader" type="file" multiple />
      </form>
    </div>
    <Footer :componentHeight="componentHeight"/>
    <div @drop.prevent="drop_handler($event)" @dragenter="dragover_handler($event)" @click="clearSelection($event)" class="workSpace" style="width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgb(235, 235, 235); box-shadow: inset 0px 0px 85px rgb(135, 135, 135); z-index: 1;"></div>
    <div class="createFolderModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert" style="min-width: 550px;">
        <span @click="closeModal($event)" style="color: red; font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        <input v-model="folderName" style="max-width: 200px; margin: auto;" type="text" class="form-control" id="folderName" aria-describedby="folderName">
        <div style="width: 100%; display: flex;">
          <button style="margin: 5px auto;" @click="createFolder()" class="btn btn-primary" type="button">Создать папку</button>
        </div>
      </div>
    </div>
    <div class="fileModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert">
        <span @click="closeModal($event)" style="color: red; font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        <h2>
          {{ currentOpenFile.name }}
        </h2>
        
          <div v-if="currentOpenFile.type.includes('img')" style="display: flex; justify-content: center;">
            <img :src="`${baseUrl}/files/getpreview?previewname=${currentOpenFile.name}&filetype=${currentOpenFile.type}&useremail=${useremail}`" @error="$event.target.src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" style="width: 50%; height: 100%;">
          </div>
          <div v-else-if="currentOpenFile.type.includes('mp4')" style="display: flex; justify-content: center;">
            <video autoplay loop style="width: 50%; height: 100%;" controls>
              <source :src="`${baseUrl}/files/getpreview?previewname=${currentOpenFile.name}&filetype=${currentOpenFile.type}&useremail=${useremail}`"/>
            </video>
          </div>
          <div v-else-if="currentOpenFile.type.includes('mp3')" style="display: flex; justify-content: center;">
            <audio :src="`${baseUrl}/files/getpreview?previewname=${currentOpenFile.name}&filetype=${currentOpenFile.type}&useremail=${useremail}`" controls></audio>
          </div>
        
        
        <p>
          Расположение файла: {{ currentOpenFile.path }}
        </p>
        <p>
          Задана ссылка: {{ currentOpenFile.linked }}
        </p>
      </div>
    </div>
    <div class="fileLinkModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert">
        <span @click="closeModal($event)" style="color: red; font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        Сгенерированная ссылка: <br/>
        <a :href="`https://upcload.herokuapp.com/links/?owner=${currentOpenFile.owner}&path=${currentOpenFile.path}&filename=${currentOpenFile.name}&link=${currentOpenFile.link}`">{{ `https://upcload.herokuapp.com/links/?owner=${currentOpenFile.owner}&path=${currentOpenFile.path}&filename=${currentOpenFile.name}&link=${currentOpenFile.link}` }}</a>
      </div>
    </div>
    <div class="filePropsModal" style="display: none; flex-direction: row; justify-content: center; align-items: center; width:100%; height: 100%; position: fixed; top: 0px; left: 0px; background-color: rgba(0, 0, 0, 0.7); z-index: 5;">
      <div class="alert alert-primary" role="alert">
        <span @click="closeModal($event)" style="color: red; font-size: 56px; cursor:pointer; position: fixed; top: 0px; left: calc(100% - 5%)" class="material-icons">
          cancel
        </span>
        <h2>
          Название файла: {{ currentOpenFile.name }}
        </h2>
        <p>
          Размер файла: {{ computeSize(currentOpenFile.size) }} {{ computeMeasure(currentOpenFile.size, 0) }}
        </p>
        <p>
          Расположение файла: {{ currentOpenFile.path }}
        </p>
        <p>
          Расширение файла: {{ currentOpenFile.type }}
        </p>
        <p>
          Задана ссылка: {{ currentOpenFile.linked }}
        </p>
        <div v-if="currentOpenFile !== null && currentOpenFile !== undefined">
          <p>Последний раз обновлен {{ currentOpenFile.updated.toLocaleString() }}.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
document.addEventListener('dragover', (dragEvent) => {
  dragEvent.preventDefault()
})

import * as jwt from 'jsonwebtoken'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'

const baseUrl = process.env.VUE_APP_BASE_URL

export default {
  name: 'Home',
  data(){
    return {
      levelOfFreeSpace: "success",
      searchkwrds: '',
      freeSpaceSize: 0,
      freeSpaceMeasure: "Кб",
      allFiles: [],
      selection: [],
      contextWindow: null,
      menuItems: [],
      path: "root/",
      folderName: '',
      content: '',
      propsFileSize: 0,
      propsFileUpdated: Date.now,
      currentOpenFile: {
        updated: Date.now,
        type: 'img',
        link: '##############'
      },
      token: '',
      useremail: '',
      user: {
        size: 100
      },
      filesList: [],
      componentHeight: 0
    }
  },
  mounted(){
    this.componentHeight = document.querySelector('.componentHeight').getBoundingClientRect().bottom
    console.log('this.componentHeight: ', this.componentHeight)
    this.token = window.localStorage.getItem("upcloadsecret")
    jwt.verify(this.token, 'upcloadsecret', (err, decoded) => {
      if(this.$route.query.redirectroute !== null && this.$route.query.redirectroute !== undefined){
        // логика перенаправления
        console.log('перенаправления')
        if(this.$route.query.redirectroute.includes('users/login') || this.$route.query.redirectroute.includes('users/register')){
          console.log('на любой путь')
          this.$router.push({ path: this.$route.query.redirectroute })
        } else if(this.$route.query.redirectroute.includes('link')){
          if(this.$route.query.crossredirect !== null && this.$route.query.crossredirect !== undefined){
            this.$router.push({ name: 'UsersLogin', query: { filename: this.$route.query.filename, useremail: this.$route.query.useremail, path: this.$route.query.path } })
          } else if(this.$route.query.crossredirect === undefined && this.$route.query.crossredirect === null){
            console.log("перенаправляю на пользовательскую ссылку")
            console.log(`this.$route.query.filename: ${this.$route.query.filename}`)
            this.$router.push({ name: "Home", query: { useremail: this.$route.query.owner, path: this.$route.query.path, filename: this.$route.query.filename, search: '' } })
          }
        } else if(!this.$route.query.redirectroute.includes('users/login') && !this.$route.query.redirectroute.includes('users/register')){
          this.$router.push({ name: "Home", query: { useremail: decoded.useremail, path: 'root', search: '' } })
        }
      } else { 
        // логика домашней страницы
        if(err){
          this.$router.push({ name: 'UsersLogin' })
        }
        this.useremail = decoded.useremail
        window.addEventListener("contextmenu", (event) => {
          event.preventDefault()
        })
        document.body.addEventListener("keyup", (event) => {
          if(document.querySelector('.fileLinkModal').style.display.includes('none') && document.querySelector('.filePropsModal').style.display.includes('none') && document.querySelector('.createFolderModal').style.display.includes('none') && document.querySelector('.fileModal').style.display.includes('none')){
            this.showFileModal(event, false, false, '')
            this.deleteFile(event)
            this.makeDir(event)
            this.makeLink(event)
            this.properties(event)
            this.downloadFile(event)
          }
        })

        if(this.$route.query.path !== null && this.$route.query.path !== undefined){
          this.path = this.$route.query.path
        } else {
          this.path = 'root'
        }
        
        fetch(`https://upcload.herokuapp.com/home/?useremail=${decoded.useremail}`, {
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
          this.user = JSON.parse(result).user
          console.log(`usersize: ${this.user.size}`)
          console.log(`NAN: ${ this.computeSize(this.user.size)}`)
          if(Number(this.user.size) === 4194304){
            this.levelOfFreeSpace = "success"
            this.$refs.progressbar.style.width = "100%"
          } else if(Number(this.user.size) < 4194304 && Number(this.user.size) >= 4194304 / 100 * 75){
            this.levelOfFreeSpace = "info"
            this.$refs.progressbar.style.width = "75%"
          } else if(Number(this.user.size) < 4194304 / 100 * 75 && Number(this.user.size) >= 4194304 / 100 * 50){
            this.levelOfFreeSpace = "warning"
            this.$refs.progressbar.style.width = "50%"
          } else if(Number(this.user.size) < 4194304 / 100 * 50 && Number(this.user.size) >= 4194304 / 100 * 25){
            this.levelOfFreeSpace = "danger"
            this.$refs.progressbar.style.width = "25%"
          } else if(Number(this.user.size) < 4194304 / 100 * 25){
            this.$refs.progressbar.style.width = "0%"
          }
          
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
          if(this.$route.query.search.length >= 1){
            this.allFiles = this.allFiles.filter(file => {
              if(file.name.includes(this.$route.query.search)){
                return true
              }
              return false
            })
          }

          if(this.$route.query.filename !== null && this.$route.query.filename !== undefined){
            this.showFileModal(this.$event, true, true, this.$route.query.filename)
          }

        });
      }
    })
  },
  methods: {
    makeLink(event){
      if(this.selection.length === 1 && event.code == 'KeyL'){
        document.querySelector('.fileLinkModal').style.display = `flex`
        this.currentOpenFile = this.allFiles.filter(file => {
          if(this.selection[0] === file._id){
            return true
          }
          return false
        })
        fetch(`https://upcload.herokuapp.com/files/generatelink/?fileid=${this.selection[0]}`, {
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
          console.log("JSON.parse(result): ", JSON.parse(result))
          console.log("this.currentOpenFile: ", this.currentOpenFile)
          this.currentOpenFile[0].link = JSON.parse(result).link
          this.currentOpenFile = this.currentOpenFile[0]
        })
      }
    },
    properties(event){
      if(this.selection.length === 1 && event.code === 'KeyP'){
        this.currentOpenFile = this.allFiles.filter((file) => {
          if(file._id === this.selection[0]){
            return true
          }
          return false
        })[0]
        document.querySelector('.filePropsModal').style.display = `flex`
      }
    },
    downloadFile(event){
      if(this.selection.length === 1 && event.code === 'KeyD'){
        this.currentOpenFile = this.allFiles.filter((file) => {
          if(file._id === this.selection[0]){
            return true
          }
          return false
        })[0]
        window.location = `${baseUrl}/files/downloads/?useremail=${this.useremail}&filename=${this.currentOpenFile.name}&filepath=${this.path + '/' + this.currentOpenFile.name}`
      }
      
    },
    makeDir(event){
      if(event.code == 'KeyM'){
        document.querySelector('.createFolderModal').style.display = `flex`
      }
    },
    searchFiles(){
      window.location = `/?useremail=${this.useremail}&path=${this.path}&search=${this.searchkwrds}`
    },
    openpanel(){
      window.showOpenFilePicker({     
        types: [
          {
            description: 'Supported Files',
            accept: {
              'audio/mp3': ['.mp3'],
              'image/png': ['.png'],
              'video/mp4': ['.mp4'],
            },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: true,
      }).then(async files => {
        console.log('files: ', files)
        for(let file of files){
          this.filesList.push(await file.getFile())
        }
        console.log('this.filesList: ', this.filesList)
        this.$refs.fileUploader.files = new FileListItems(
          this.filesList
        )
        this.uploadFiles(this.$event)
      }).catch(e => console.log('windowerror: ', e))
    },
    computeMeasure(size, cursorOfMeasure){
      let cursor = cursorOfMeasure
      cursor++
      console.log('cursor: ', cursor)
      if(Math.ceil(size / 1024) > 1){
        return this.computeMeasure(size / 1024, cursor)
      } else if(Math.ceil(size / 1024) <= 1){
          console.log('----------------------------------------')
          if(cursor === 1){
            return "б"
          } else if(cursor === 2){
            return "Кб"
          } else if(cursor === 3){
            return "Мб"
          } else if(cursor === 4){
            return "Гб"
          }
          
      }
    },
    computeSize (size)  {
      if (Math.ceil(size / 1024) > 1) {
        return this.computeSize(size / 1024)
      } else if(Math.ceil(size / 1024) <= 1){
        return size.toFixed(2);
      }
    },
    deleteFile(event){
      if(this.selection.length >= 1 && event.code === 'Delete'){
        fetch(`https://upcload.herokuapp.com/files/delete/?fileids=${this.selection.join(',')}&owner=${this.useremail}`, {
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
          window.location.reload()
        })
      }
    },
    showFileModal(event, free, startup, filename){
      if(!startup) {
        if(this.selection.length === 1 && ((event.code == 'NumpadEnter' || event.code == 'Enter') || free)){
          document.querySelector('.fileModal').style.display = `flex`
          this.currentOpenFile = this.allFiles.filter(file => {
            if(file._id === this.selection[0]){
              return true
            }
            return false
          })[0]
          console.log("this.currentOpenFile: ", this.currentOpenFile)
        }
      } else if(startup) {
        document.querySelector('.fileModal').style.display = `flex`
        this.currentOpenFile = this.allFiles.filter(file => {
          if(file.name === filename){
            return true
          }
          return false
        })[0]
        console.log("this.currentOpenFile: ", this.currentOpenFile)
      }
    },
    download(event, fileName){
      window.location = `${baseUrl}/files/downloads/?useremail=${this.useremail}&filename=${fileName}&filepath=${this.path + '/' + fileName}`
    },
    previousFolder(){
      let previousDir = this.path.split('/')
      previousDir.pop()
      this.$router.push({ name: 'Home', query: { path: previousDir.join('/'), useremail: this.useremail, search: "" } })
      window.location.reload()
    },
    createFolder(){
      fetch(`https://upcload.herokuapp.com/files/createfolder/?filename=${this.folderName}&filepath=${this.path}&owner=${this.useremail}`, {
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
        })
    },
    changePath(event, folderName, fileType){
      if(fileType.includes("group")){
        this.$router.push({ name: 'Home', query:{ path: `${this.path}/${folderName}`, useremail: this.useremail, search: "" } })
        window.location.reload()
      } else if(!fileType.includes("group")){
        this.showFileModal(event, true, false, '')
      }
    },
    uploadFiles(event) {
      let totalSize = 0
      for(let file of this.$refs.fileUploader.files){
        totalSize += file.size
      }
      setTimeout(() => {
        if(totalSize <= this.user.size){
          document.querySelector('.formOfUploadedFiles').method = "POST"
          document.querySelector('.formOfUploadedFiles').submit()
        } else if(totalSize > this.user.size){
          console.log("в вашем аккаунте нет больше доступного места")
        }
      }, 2000)
    },
    closeModal(event){
      event.target.parentNode.parentNode.style.display = "none"
    },
    clearSelection(event) {
      this.selection = []
      document.querySelectorAll('.my-card-header').forEach(element => {
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
      console.log('drag')
      event.preventDefault()
      this.$refs.cloud.style.fontSize = '256px'
      this.$refs.cloud.style.top = 'calc(100% - 35%)'
      this.$refs.cloud.style.left = 'calc(100% - 25%)'
    },
    drop_handler(event){
      this.$refs.cloud.style.fontSize = '124px'
      this.$refs.cloud.style.top = 'calc(100% - 25%)'
      this.$refs.cloud.style.left = 'calc(100% - 15%)'
      console.log('event.dataTransfer.files: ', event.dataTransfer.files)
        if(Array.from(event.dataTransfer.files).every((file, fileIndex, fileList) => {
        return file.type.includes('png') || file.type.includes('mp4') || file.type.includes('mp3')})){
          console.log("все файлы подходят")
          this.$refs.fileUploader.files = event.dataTransfer.files
          let totalSize = 0
          for(let file of this.$refs.fileUploader.files){
            totalSize += file.size
          }
          setTimeout(() => {
            if(totalSize <= this.user.size){
              document.querySelector('.formOfUploadedFiles').method = "POST"
              document.querySelector('.formOfUploadedFiles').submit()
            } else if(totalSize > this.user.size){
              console.log("в вашем аккаунте нет больше доступного места")
            }
          }, 2000)
        } else {
          console.log('Вы пытаетесь загрузить файлы с не подходящим расширением')
        }
    },
    expandSelect(event, fileName, click){
      if(click.includes("left")){
        if(event.target.parentNode.previousElementSibling.getAttribute('data-selected').includes("false")){
          //добавляем выделение
          if((event.target.parentNode.previousElementSibling.getAttribute('data-selected').includes("false") && !event.ctrlKey)){
            for(let card of document.querySelectorAll('.my-card-body')){
              card.parentNode.classList -= ` text-white bg-info`
              card.parentNode.classList += ` card`
              card.parentNode.previousElementSibling.setAttribute('data-selected', "false")
            }
            this.selection = []
          }
          event.target.parentNode.classList += ` text-white bg-info`
          event.target.parentNode.style = `cursor: pointer; margin: 5px; border: 1px solid rgb(190, 190, 190); border-radius: 5px; float: left;  width: 275px;  height: 250px;`
          event.target.parentNode.previousElementSibling.setAttribute('data-selected', "true")
          this.selection.push(event.target.parentNode.previousElementSibling.value)
        } else if(event.target.parentNode.previousElementSibling.getAttribute('data-selected').includes("true")){
          
          //вычитаем выделение
          event.target.parentNode.classList -= ` text-white bg-info`
          event.target.parentNode.classList += ` card`
          event.target.parentNode.previousElementSibling.setAttribute('data-selected', "false")
          
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
  } else if(click.includes("right")){
    try{
      document.querySelector('.contextMenu').remove()
    } catch(e) {
      console.log('не могу удалить, потому что не существует окно')
    }
    if(this.selection.length >= 1 || this.allFiles.length <= 0){
      this.contextWindow = document.createElement("div")
      this.menuItems = []
      if(this.selection.length === 1){
        this.menuItems.push("Открыть")
      }
      this.menuItems.push("Создать папку")
      if(this.selection.length >= 1){
        this.menuItems.push("Удалить")
      }
      if(this.selection.length === 1){
        this.menuItems.push("Сделать ссылкой")
        this.menuItems.push("Скачать")
        this.menuItems.push("Свойства")
      }
      this.contextWindow.classList += "contextMenu"
      this.contextWindow.style = `
        min-width: 285px;
        min-height: 250px;
        background-color: rgb(245, 245, 245);
        border: 1px solid rgb(125, 125, 125);
        position: absolute;
        top: ${event.pageY}px;
        left: ${event.pageX}px;
        z-index: 2;
        box-sizing: border-box;
        padding: 15px;
      `
      for(let menuItem of this.menuItems){
                let menuItemTool = document.createElement("p")
                menuItemTool.innerHTML = menuItem
                menuItemTool.style = `
                    cursor: pointer;
                `
                
                menuItemTool.addEventListener("click", (event) => {
                    console.log('event.target: ', event.target.textContent)
                    if(event.target.textContent.includes("Открыть")){
                      this.showFileModal(event, true, false, '')
                    } else if(event.target.textContent.includes("Создать папку")){
                      document.querySelector('.createFolderModal').style.display = `flex`
                    } else if(event.target.textContent.includes("Открыть")){

                    } else if(event.target.textContent.includes("Удалить")){
                      console.log('this.selection.join(,): ', this.selection.join(','))
                      fetch(`https://upcload.herokuapp.com/files/delete/?fileids=${this.selection.join(',')}&owner=${this.useremail}`, {
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
                        window.location.reload()
                      })
                    } else if(event.target.textContent.includes("Скачать")){
                      this.download(event, fileName)
                    } else if(event.target.textContent.includes("Сделать ссылкой")){
                        document.querySelector('.fileLinkModal').style.display = `flex`
                        this.currentOpenFile = this.allFiles.filter(file => {
                          if(this.selection[0] === file._id){
                            return true
                          }
                          return false
                        })
                        fetch(`https://upcload.herokuapp.com/files/generatelink/?fileid=${this.selection[0]}`, {
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
                          console.log("JSON.parse(result): ", JSON.parse(result))
                          console.log("this.currentOpenFile: ", this.currentOpenFile)
                          this.currentOpenFile[0].link = JSON.parse(result).link
                          this.currentOpenFile = this.currentOpenFile[0]
                        })
                    } else if(event.target.textContent.includes("Свойства")){
                        this.currentOpenFile = this.allFiles.filter((file) => {
                          if(file._id === this.selection[0]){
                            return true
                          }
                          return false
                        })[0]
                        document.querySelector('.filePropsModal').style.display = `flex`
                    }

                })
                this.contextWindow.appendChild(menuItemTool)
            }
            document.body.appendChild(this.contextWindow)
          }
        }
    }
  },
  components: {
    Footer,
    Header
  }
}

function FileListItems(files){
  var b = new ClipboardEvent("").clipboardData || new DataTransfer()
  for (var i = 0, len = files.length; i<len; i++){
    b.items.add(files[i])
  }
  return b.files
}
</script>
<style scoped>
  .plate {
    width: 100%;
    height: 100%;
    background-color: rgb(255, 255, 255);
  }
</style>