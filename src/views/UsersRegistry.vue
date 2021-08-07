<template>
  <div style=" background-color: rgb(235, 235, 235); box-shadow: inset 0px 0px 85px rgb(135, 135, 135); z-index: -5; min-height: 750px;">
    <div class="componentHeight">
      <Header :auth="false" :user="''"/>
      <div class="main">
        <img src="../assets/cloudnew.png" width="30%" height="30%" alt="">            
        <h1 class="h3 mb-3 font-weight-normal">Зарегестрируйтесь</h1>
        
        <label for="inputEmail" class="sr-only">Email</label>
        <input v-model="useremail" type="email" id="inputEmail" class="form-control" placeholder="Email address" required="" autofocus="">
        <label for="inputPassword" class="sr-only">Password</label>
        <div style="display: flex;">
          <input ref="passwordfield" v-model="userpassword" type="password" id="inputPassword" class="form-control" placeholder="Password" required="">
          <span ref="visibilitybtn" style="margin: 5px; cursor: pointer;" class="material-icons" @click="toggleVisibility()">
            visibility
          </span>
        </div>
        <label for="inputEmail" class="sr-only">Name</label>
        <input  v-model="username" type="text" id="inputEmail" class="form-control" placeholder="Name" required="" autofocus="">
        <label for="inputEmail" class="sr-only">Age</label>
        <input  v-model="userage" type="number" id="inputEmail" class="form-control" placeholder="Age" required="" autofocus="">
        
        <div class="checkbox mb-3">
        </div>
        <button @click="register()" class="btn btn-lg btn-primary btn-block registerBtn">Зарегестрироваться</button>
        <div class="customErros">{{ errors }}</div>
      </div>
    </div>
    <Footer :componentHeight="componentHeight"/>
  </div>
</template>

<script>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

import * as jwt from 'jsonwebtoken'

export default {
  name: 'UsersRegistry',
  data(){
    return {
      errors: "",
      token: '',
      useremail: '',
      userpassword: '',
      username: '',
      userage: 0,
      componentHeight: 0
    }
  },
  mounted(){
    this.componentHeight = document.querySelector('.componentHeight').getBoundingClientRect().bottom
    console.log('this.componentHeight: ', this.componentHeight)
  },
  methods:{
    toggleVisibility(){
      if(this.$refs.passwordfield.type.includes("text")){
        this.$refs.passwordfield.type = "password"
        this.$refs.visibilitybtn.textContent = "visibility"
      } else {
        this.$refs.passwordfield.type = "text"
        this.$refs.visibilitybtn.textContent = "visibility_off"
      }
    },
    goToPage(page){
      if(page.includes('home')){
        this.$router.push({ name: 'Home', query: { path: 'root' } })
      } else if(page.includes('register')){
        this.$router.push({ name: 'UsersRegistry', query: {  } })
      } else if(page.includes('login')){
        this.$router.push({ name: 'UsersLogin', query: {  } })
      }
    },
    register(){
      fetch(`https://upcload.herokuapp.com/users/usercreatesuccess/?useremail=${this.useremail}&userpassword=${this.userpassword}&username=${this.username}&userage=${this.userage}`, {
      // fetch(`http://localhost:4000/users/usercreatesuccess/?useremail=${this.useremail}&userpassword=${this.userpassword}&username=${this.username}&userage=${this.userage}`, {
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
          if(this.useremail.includes("@")){
            if(JSON.parse(result).status.includes("OK")){
              this.$router.push({ 'name': "UsersLogin" })
            } else if(JSON.parse(result).status.includes("Error")){
              this.errors = "Такой пользователь уже существует!!!"
            }
          } else if(!this.useremail.includes("@")){
            this.errors = "Вы не указали email!!!"
          }
        });
      }
    },
    components: {
      Header,
      Footer
    }
  }
</script>
<style scoped>
  .main {
      width: 50%;
      margin:auto;
      text-align: center;
  }
  .customErros {
    color: red;
    font-weight: bolder;
  }
</style>