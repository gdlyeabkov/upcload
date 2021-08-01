<template>
    <div ref="footer">
        <p class="mt-5 mb-3 text-muted">© {{ new Date().toLocaleDateString() }}</p> 
    </div>
</template>
<script>
export default {
    props: [ 'componentHeight' ],
    mounted(){
        this.$refs.footer.style = `
            background-color: rgb(185, 185, 185);
            position: relative;
            top: 0px;
            left: 0px;
            height: ${document.body.clientHeight - this.componentHeight}px;
        `
    }
}
</script>