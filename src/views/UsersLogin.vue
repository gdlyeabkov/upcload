<template>
  <div style="background-color: rgb(235, 235, 235); box-shadow: inset 0px 0px 85px rgb(135, 135, 135); z-index: -5; min-height: 750px;">
    <div class="componentHeight">
      <Header :auth="false" :user="''"/>
      <div class="customCardGroup">
        <img src="../assets/cloudnew.png" width="30%" height="30%" alt="">
        <h1 class="h3 mb-3 font-weight-normal">Войдите</h1>
        <label for="inputEmail" class="sr-only">Email</label>
        <input v-model="useremail" type="email" id="inputEmail" class="form-control" placeholder="Email address" required="" autofocus="">
        <label for="inputPassword" class="sr-only">Password</label>
        <input v-model="userpassword" type="password" id="inputPassword" class="form-control" placeholder="Password" required="">
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
      freespace: 0,
      componentHeight: 0
    }
  },
  mounted(){
    this.componentHeight = document.querySelector('.componentHeight').getBoundingClientRect().bottom
    console.log('this.componentHeight: ', this.componentHeight)
    if(this.$route.query.freespace === undefined || this.$route.query.freespace === null){
      this.freespace = 104857600
    } else {
      this.freespace = this.$route.query.freespace
    }
  },
  methods:{
    goToPage(page){
      console.log('goto')
      if(page.includes('register')){
        this.$router.push({ name: 'UsersRegistry', query: {  } })
      } else if(page.includes('login')){
        this.$router.push({ name: 'UsersLogin', query: {  } })
      }
    },
    login(){
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
            this.$router.push({ 'name': "Home", query: { "useremail": this.useremail, "path": "root", "freespace": this.freespace } })
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