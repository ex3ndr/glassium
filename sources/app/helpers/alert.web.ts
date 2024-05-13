import sweetAlert from 'sweetalert2';

export async function alert(title: string, message: string, buttons: { text: string, style?: 'cancel' | 'destructive' | 'default' }[]): Promise<number> {
    return sweetAlert.fire({
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: buttons[0].text,
        cancelButtonText: buttons[1].text,
        confirmButtonColor: buttons[0].style === 'destructive' ? '#ff0000' : '#007aff',
        cancelButtonColor: buttons[1].style === 'destructive' ? '#ff0000' : '#007aff',
    }).then((res) => {
        return res.isConfirmed ? 0 : 1;
    });
}