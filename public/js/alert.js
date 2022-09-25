//khi hiển thị thông báo phải ẩn tất cả các thông báo có trước đó
export const hideAlert = () =>{
    const el = document.querySelector('.alert');
    if(el) el.parentElement.removeChild(el)
}

//type is 'success' or 'error'
export const showAlert = (type, msg) =>{
    hideAlert();
    const markup = `<div class='alert alert--${type}'>${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
    window.setTimeout(hideAlert,5000); // ẩn tất cả các thông báo sau 5s
}