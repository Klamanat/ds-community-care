import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as svc from '../services/birthdayService.js'
import { useUiStore } from './ui.js'

const FALLBACK_BG = [
  'linear-gradient(135deg,#C7D2FE,#818CF8)',
  'linear-gradient(135deg,#FBCFE8,#F472B6)',
  'linear-gradient(135deg,#BBF7D0,#4ADE80)',
  'linear-gradient(135deg,#FDE68A,#F59E0B)',
  'linear-gradient(135deg,#FCA5A5,#EF4444)',
  'linear-gradient(135deg,#6EE7B7,#059669)',
]
const FALLBACK_EMOJI = ['😄','🌟','🦊','🦋','🐯','🌸']

// seed data keyed by 0-based month index
const SEED = {
  0: [{key:'jan1',name:'Somsak P.',role:'HR Manager',date:'5 ม.ค.',fallbackIdx:0,photo:null,wishes:[{from:'Anya R.',avIdx:0,msg:'สุขสันต์วันเกิดนะคะ! 🎉🎂',time:'เมื่อกี้'}]},{key:'jan2',name:'Pim T.',role:'Developer',date:'18 ม.ค.',fallbackIdx:1,photo:null,wishes:[]}],
  1: [{key:'feb1',name:'Nok S.',role:'Team Lead',date:'12 ก.พ.',fallbackIdx:3,photo:null,wishes:[{from:'Anya R.',avIdx:0,msg:'สุขสันต์วันเกิดพี่น๊อกนะคะ! 🌸',time:'10 นาทีที่แล้ว'}]}],
  2: [{key:'mar1',name:'Tom K.',role:'Designer',date:'20 มี.ค.',fallbackIdx:2,photo:null,wishes:[{from:'Pam W.',avIdx:1,msg:'Happy Birthday Tom! 🎨✨',time:'1 ชม.ที่แล้ว'}]},{key:'mar2',name:'May J.',role:'Marketing',date:'28 มี.ค.',fallbackIdx:3,photo:null,wishes:[]},{key:'mar3',name:'Art P.',role:'Finance',date:'3 มี.ค.',fallbackIdx:4,photo:null,wishes:[]}],
  3: [{key:'apr1',name:'Fon W.',role:'Operations',date:'8 เม.ย.',fallbackIdx:5,photo:null,wishes:[]},{key:'apr2',name:'Bank P.',role:'IT Support',date:'22 เม.ย.',fallbackIdx:0,photo:null,wishes:[]}],
  4: [{key:'may1',name:'Kwan S.',role:'HR Specialist',date:'1 พ.ค.',fallbackIdx:1,photo:null,wishes:[]}],
  5: [{key:'jun1',name:'Mook T.',role:'Designer',date:'15 มิ.ย.',fallbackIdx:2,photo:null,wishes:[]},{key:'jun2',name:'Pat K.',role:'Marketing',date:'27 มิ.ย.',fallbackIdx:3,photo:null,wishes:[]}],
  6: [],
  7: [{key:'aug1',name:'Ann R.',role:'Accounting',date:'9 ส.ค.',fallbackIdx:4,photo:null,wishes:[]}],
  8: [{key:'sep1',name:'Bee N.',role:'Developer',date:'5 ก.ย.',fallbackIdx:5,photo:null,wishes:[]},{key:'sep2',name:'Gun T.',role:'Sales',date:'19 ก.ย.',fallbackIdx:0,photo:null,wishes:[]}],
  9: [{key:'oct1',name:'Ning P.',role:'Operations',date:'11 ต.ค.',fallbackIdx:1,photo:null,wishes:[]}],
  10:[{key:'nov1',name:'Film S.',role:'HR Manager',date:'7 พ.ย.',fallbackIdx:2,photo:null,wishes:[]},{key:'nov2',name:'Joe K.',role:'Developer',date:'23 พ.ย.',fallbackIdx:3,photo:null,wishes:[]}],
  11:[{key:'dec1',name:'Mint T.',role:'Designer',date:'14 ธ.ค.',fallbackIdx:4,photo:null,wishes:[]},{key:'dec2',name:'Peak R.',role:'Marketing',date:'25 ธ.ค.',fallbackIdx:5,photo:null,wishes:[]}],
}

export const useBirthdayStore = defineStore('birthday', () => {
  // allEmployees is reactive object keyed by month index
  const allEmployees = reactive({ ...SEED })
  const loadedMonths = ref(new Set())
  const isLoading = ref(false)

  const SENDER_AVATARS = [
    {av:'😊',bg:'linear-gradient(135deg,#C7D2FE,#818CF8)',name:'Anya R.'},
    {av:'🦁',bg:'linear-gradient(135deg,#BBF7D0,#4ADE80)',name:'Pam W.'},
    {av:'🐬',bg:'linear-gradient(135deg,#FDE68A,#F59E0B)',name:'Tom K.'},
    {av:'🌸',bg:'linear-gradient(135deg,#FBCFE8,#F472B6)',name:'Nok S.'},
  ]

  function getEmployee(key) {
    for (const arr of Object.values(allEmployees)) {
      const e = arr.find(x => x.key === key)
      if (e) return e
    }
    return null
  }

  function getFallbackBg(idx) { return FALLBACK_BG[idx % FALLBACK_BG.length] }
  function getFallbackEmoji(idx) { return FALLBACK_EMOJI[idx % FALLBACK_EMOJI.length] }
  function getSenderAvatar(idx) { return SENDER_AVATARS[idx % SENDER_AVATARS.length] }

  async function loadMonth(monthIdx, force = false) {
    if (!force && loadedMonths.value.has(monthIdx)) return
    isLoading.value = true
    try {
      const data = await svc.fetchMonth(monthIdx)
      if (data && data.length) allEmployees[monthIdx] = data
      loadedMonths.value.add(monthIdx)
    } catch {
      loadedMonths.value.add(monthIdx) // mark as attempted
    } finally {
      isLoading.value = false
    }
  }

  async function sendWish(key, msg, fromName, avIdx) {
    const ui = useUiStore()
    const emp = getEmployee(key)
    if (!emp) return
    const temp = { from: fromName, avIdx, msg, time: 'เมื่อกี้' }
    emp.wishes.unshift(temp)
    try {
      await svc.addWish(key, msg, fromName, avIdx)
      ui.showToast('ส่งคำอวยพรสำเร็จ! 🎉')
    } catch {
      emp.wishes = emp.wishes.filter(w => w !== temp)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  function uploadPhoto(key, dataUrl) {
    const emp = getEmployee(key)
    if (emp) emp.photo = dataUrl
  }

  return { allEmployees, loadedMonths, isLoading, getEmployee, getFallbackBg, getFallbackEmoji, getSenderAvatar, loadMonth, sendWish, uploadPhoto }
})
