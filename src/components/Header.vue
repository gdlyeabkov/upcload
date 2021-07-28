<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
        <a class="navbar-brand" href="#">Upcload</a>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div class="navbar-nav">
                <a style="cursor: pointer;" @click="goToPage('home')" class="nav-link active" aria-current="page">Домой</a>
                <a style="cursor: pointer;" @click="goToPage('register')" class="nav-link active" aria-current="page">Регистрация</a>
                <a style="cursor: pointer;" @click="goToPage('login')" class="nav-link active" aria-current="page">Авторизация</a>
                <a style="cursor: pointer;" @click="goToPage('login')" class="nav-link active" aria-current="page">Выйти</a>
            </div>
        </div>
        </div>
    </nav>    
</template>
<script>
export default {
    methods: {
        logout(){
            this.token = jwt.sign({
                useremail: "asd"
            }, 'upcloadsecret', { expiresIn: '5m' })
            this.$router.push({ name: "UsersLogin" })
        },
        goToPage(page){
            console.log('goto')
            if(page.includes('home')){
                this.$router.push({ name: 'Home', query: { path: 'root' } })
            } else if(page.includes('register')){
                this.$router.push({ name: 'UsersRegistry', query: {  } })
            } else if(page.includes('login')){
                this.$router.push({ name: 'UsersLogin', query: {  } })
            }
        },
    }
}
</script>