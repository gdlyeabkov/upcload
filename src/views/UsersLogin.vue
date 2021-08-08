<template>
  <div style="background-color: rgb(235, 235, 235); box-shadow: inset 0px 0px 85px rgb(135, 135, 135); z-index: -5; min-height: 750px;">
    <div class="componentHeight">
      <Header :auth="false" :user="''"/>
      <div class="customCardGroup">
        <img src="../assets/cloudnew.png" width="30%" height="30%" alt="">
        <h1 class="h3 mb-3 font-weight-normal">Войдите</h1>
        <label for="inputEmail" class="sr-only">Email</label>
        <input v-model="useremail" type="email" id="inputEmail" class="form-control" placeholder="Email address" required="" autofocus="" style="margin: 5px;">
        <label for="inputPassword" class="sr-only">Password</label>
        <div style="display: flex;">
          <input ref="passwordfield" v-model="userpassword" type="password" id="inputPassword" class="form-control" placeholder="Password" required=""/>
          <span ref="visibilitybtn" style="margin: 5px; cursor: pointer;" class="material-icons" @click="toggleVisibility()">
            visibility
          </span>
        </div>
        <div class="checkbox mb-3">
        </div>
        <button class="btn btn-lg btn-primary btn-block loginBtn" @click="login()">Войти</button>
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
  name: 'UsersLogin',
  data(){
    return {
      useremail: '',
      userpassword: '',
      errors: "",
      token: '',
      componentHeight: 0
    }
  },
  mounted(){
    
    if(this.$route.query.filename !== null && this.$route.query.filename !== undefined){
      this.$router.push({ name: 'Home', query: { useremail: this.$route.query.useremail, path: this.$route.query.path, filename: this.$route.query.filename, search: '' } })
    }

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
      console.log('goto')
      if(page.includes('register')){
        this.$router.push({ name: 'UsersRegistry', query: {  } })
      } else if(page.includes('login')){
        this.$router.push({ name: 'UsersLogin', query: {  } })
      }
    },
    login(){
      // fetch(`http://localhost:4000/users/check/?useremail=${this.useremail}&userpassword=${this.userpassword}`, {
      fetch(`https://upcload.herokuapp.com/users/check/?useremail=${this.useremail}&userpassword=${this.userpassword}`, {
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
            this.token = jwt.sign({
              useremail: this.useremail
              }, 'upcloadsecret', { expiresIn: '5m' })
            localStorage.setItem('upcloadsecret', this.token)
            this.$router.push({ 'name': "Home", query: { "useremail": this.useremail, "path": "root", "search": "" } })
          } else if(JSON.parse(result).status.includes("Error")){
            this.errors = "Такого пользователя не существует!!!"
          }
        } else if(!this.useremail.includes("@")){
          this.errors = "Такого пользователя не существует!!!"
        }
      });
    }
  },
  components:{
      Header,
      Footer
  }
}
</script>
<style scoped>
  .customCardGroup {
    margin:auto;
    display:flex;
    justify-content: center;
    width:35%;
    flex-direction: column; 
    text-align: center;
  }

  .customCardGroup > button{
    margin:auto;
    display:flex;
    justify-content: center;
    width:35%;
    flex-direction: column; 
    text-align: center;
    box-sizing: border-box;
    padding: 5px 55px;
  }

  .customCardGroup img {
    display: block;
    margin:auto;
  }
  .customErros {
    color: red;
    font-weight: bolder;
  }
</style>