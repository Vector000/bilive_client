import { Buffer } from 'buffer'

// 异或加密

export function xorStrings(key: string, input: string):string {
    let output:string = '';
    for(let i = 0, len = input.length; i < len; i++) {
      output += String.fromCharCode(
        input.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return output;
  }
  
export const B64XorCipher = {
  encode(key: string, data: string): string {
    return (data && data !== '' && key !== '')? new Buffer(xorStrings(key, data), 'utf8').toString('base64') : data;
  },
  decode(key: string, data: string): string {
    return (data && data !== '' && key !== '')? xorStrings(key, new Buffer(data, 'base64').toString('utf8')) : data;
  }
};

/**
 * 弹窗提示
 * 无参数时只显示遮罩
 *
 * @param {modalOPtions} [options]
 */
const modalDiv = <HTMLDivElement>document.querySelector('.modal')
const template = <HTMLDivElement>document.querySelector('#template')

export function modal(options?: modalOPtions) {
  if (options != null) {
    const modalDialogDiv = <HTMLDivElement>modalDiv.querySelector('.modal-dialog')
    const modalTemplate = <HTMLTemplateElement>template.querySelector('#modalContentTemplate')
    const clone = document.importNode(modalTemplate.content, true)
    const headerTitle = <HTMLHeadingElement>clone.querySelector('.modal-header .modal-title')
    const headerClose = <HTMLElement>clone.querySelector('.modal-header .close')
    const modalBody = <HTMLDivElement>clone.querySelector('.modal-body')
    const footerClose = <HTMLElement>clone.querySelector('.modal-footer .btn-secondary')
    const footerOK = <HTMLElement>clone.querySelector('.modal-footer .btn-primary')
    headerClose.onclick = footerClose.onclick = () => {
      $(modalDiv).one('hidden.bs.modal', () => {
        modalDialogDiv.innerText = ''
        if (typeof options.onClose === 'function') options.onClose(options.body)
      })
      $(modalDiv).modal('hide')
    }
    footerOK.onclick = () => {
      $(modalDiv).one('hidden.bs.modal', () => {
        modalDialogDiv.innerText = ''
        if (typeof options.onOK === 'function') options.onOK(options.body)
      })
      $(modalDiv).modal('hide')
    }
    if (options.body instanceof DocumentFragment) modalBody.appendChild(options.body)
    else modalBody.innerText = options.body
    if (options.title != null) headerTitle.innerText = options.title
    if (options.close != null) footerClose.innerText = options.close
    if (options.ok != null) footerOK.innerText = options.ok
    if (options.showOK) footerOK.classList.remove('d-none')
    modalDialogDiv.appendChild(clone)
  }
  $(modalDiv).modal({ backdrop: 'static', keyboard: false })
}