<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
        <a class="navbar-brand" href="#">Upcload</a>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav">
                <a v-if="auth" style="cursor: pointer;" @click="goToPage('home')" class="nav-link active" aria-current="page">Домой</a>
                <a v-if="!auth" style="cursor: pointer;" @click="goToPage('register')" class="nav-link active" aria-current="page">Регистрация</a>
                <a v-if="!auth" style="cursor: pointer;" @click="goToPage('login')" class="nav-link active" aria-current="page">Авторизация</a>
                <a v-if="auth" style="cursor: pointer;" @click="goToPage('login')" class="nav-link active" aria-current="page">Выйти</a>
            </div>
        </div>
        </div>
    </nav>    
</template>
<script>
import * as jwt from 'jsonwebtoken'
export default {
    props: ["auth"],
    data(){
        return {
            token: '',
            freeSpace: 0
        }
    },
    mounted(){
        this.token = window.localStorage.getItem("upcloadsecret")
        if(this.$route.query.freespace !== null && this.$route.query.freespace !== undefined){
            this.freeSpace = this.$route.query.freespace
        }
    },
    methods: {
        logout(){
            this.token = jwt.sign({
                useremail: "asd"
            }, 'upcloadsecret', { expiresIn: '5m' })
            this.$router.push({ name: "UsersLogin",  })
        },
        goToPage(page){
            console.log('goto')
            if(page.includes('home')){
                jwt.verify(this.token, 'upcloadsecret', (err, decoded) => {
                    this.$router.push({ name: 'Home', query: { path: 'root', useremail: decoded.useremail, freespace: this.freeSpace } })
                    window.location.reload()
                })
            } else if(page.includes('register')){
                this.$router.push({ name: 'UsersRegistry', query: {  } })
            } else if(page.includes('login')){
                this.$router.push({ name: 'UsersLogin', query: {  } })
            }
        },
    }
}
</script>