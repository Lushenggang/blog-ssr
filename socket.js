// const NOTIFY_LOGIN_GITHUB = 1
// const NOTIFY_LOGIN_QQ = 2
const NOTIFY_COMMENT = 3
// const NOTIFY_LIKE = 4
const NOTIFY_COMMENT_REPLY = 5
const NOTIFY_MESSAGE = 6
const NOTIFY_MESSAGE_REPLY = 7

import io from 'socket.io-client'
import Vue from 'vue'
import { getToken, camel } from '@/tool'
import { BASE_URL } from '@/config'

function notify ({ type, username, postTitle, url, content }) {
  const { $bus: bus, $Notice: notice } = Vue.prototype
  bus.$emit('get-current-user', (userinfo) => {
    const titleInfo = {
      [NOTIFY_COMMENT]: '新增评论',
      [NOTIFY_COMMENT_REPLY]: '评论回复',
      [NOTIFY_MESSAGE]: '新增留言',
      [NOTIFY_MESSAGE_REPLY]: '留言回复'
    }
    notice.info({
      title: titleInfo[type],
      duration: 0,
      render (h) {
        console.log(this, this.$store)
        const user = h('span', {
          style: { color: '#FFA710' },
        }, username)
        const post = postTitle ? h('span', {
          style: { color: '#2d8cf0' }
        }, `《${postTitle}》`) : ''
        const info = {
          [NOTIFY_COMMENT]: ['评论了文章', post],
          [NOTIFY_COMMENT_REPLY]: ['在', post, '回复了你' ],
          [NOTIFY_MESSAGE]: [`在留言板留言`],
          [NOTIFY_MESSAGE_REPLY]: [`恢复了你的留言`]
        }
        let email = userinfo.email ? '' : h('div', {
          style: {
            marginTop: '15px',
            fontSize: `12px`,
            color: `#888`,
          }
        }, [
          '设置邮箱可以及时收到离线回复，',
          h('span', {
            props: {
              type: 'primary',
              plain: true,
            },
            style: {
              color: '#FFA710',
              cursor: 'pointer',
              userSelect: 'none',
              textDecoration: 'underline'
            },
            on: {
              click () {
                bus.$emit('click-avatar', userinfo.id)
              }
            }
          }, '现在设置')
        ])
        return h('div', {}, [
          h('div', [
            user,
            ...info[type],
            ": ",
            content,
            h('a', {
              props: {
                href: url
              }
            }, '查看详情')
          ]),
          email
        ])
      }
    })
  })
}

class Socket {
  constructor () {
    this.socket = null
  }
  init () {
    this.socket = io(BASE_URL, { path: '/api/socket.io' })
    this.socket.on('connect', () => {
      console.log('connetc')
      this.socket.emit('bind-user', { token: getToken() })
    })
    this.socket.on('message', ({ type, data }) => {
      console.log('onmessage', type, data)
      data = camel(data)
      if (type == 'notify') {
        notify(data)
      }
    })
    this.socket.on('error', (err) => {
      console.log('error', err)
      this.socket.close()
      this.init()
    })
    this.socket.on('close', () => {
      console.log('des')
      this.destroy()
    })
  }

  destroy () {
    this.socket = null
  }
}

if (process.client) {
  Vue.prototype.$socket = new Socket()
}
