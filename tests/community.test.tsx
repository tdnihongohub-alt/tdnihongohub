import React from 'react';
import { expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppContext } from '../src/store';
import { initialData } from '../src/seed';
import { PublicCommunity, PublicGroups, publicChannelLink, groupInviteLink } from '../src/CommunityLinks';

it('only accepts the actual channel and group providers',()=>{
 expect(publicChannelLink('https://www.youtube.com/@TDNihongoHUB','youtube')).toBeTruthy();
 expect(publicChannelLink('https://whatsapp.com/channel/EXAMPLE','whatsapp')).toBeTruthy();
 expect(publicChannelLink('https://chat.whatsapp.com/PRIVATE','whatsapp')).toBe('');
 expect(publicChannelLink('https://whatsapp.com.evil.example/channel/EXAMPLE','whatsapp')).toBe('');
 expect(groupInviteLink('https://chat.whatsapp.com/EXAMPLE')).toBeTruthy();
 expect(groupInviteLink('javascript:alert(1)')).toBe('');
 expect(groupInviteLink('https://whatsapp.com/channel/EXAMPLE')).toBe('');
});
it('never includes private group invites in the public homepage links',()=>{
 const data=initialData();data.settings[0].whatsappChannel='https://whatsapp.com/channel/PUBLIC';data.communityLinks=[{id:'private',name:'Private class',url:'https://chat.whatsapp.com/PRIVATE',active:true,batchId:'batch'}];
 const html=renderToString(<AppContext.Provider value={{data} as any}><MemoryRouter><PublicCommunity/></MemoryRouter></AppContext.Provider>);
 expect(html).toContain('https://whatsapp.com/channel/PUBLIC');expect(html).toContain('https://www.youtube.com/@TDNihongoHUB');expect(html).not.toContain('chat.whatsapp.com');expect(html).not.toContain('Private class');
});
it('hides the channel if the teacher clears its public link',()=>{const data=initialData();data.settings[0].whatsappChannel='';const html=renderToString(<AppContext.Provider value={{data} as any}><MemoryRouter><PublicCommunity/></MemoryRouter></AppContext.Provider>);expect(html).not.toContain('whatsapp.com');expect(html).toContain('YouTube');});
it('public group lists exclude hidden or private invitations',()=>{const data=initialData();data.communityLinks=[{id:'yes',name:'Public N5',url:'https://chat.whatsapp.com/PUBLIC',active:true,visibility:'public'},{id:'private',name:'Private N5',url:'https://chat.whatsapp.com/PRIVATE',active:true,visibility:'students'},{id:'hidden',name:'Hidden',url:'https://chat.whatsapp.com/HIDDEN',active:false,visibility:'public'}];const html=renderToString(<AppContext.Provider value={{data} as any}><MemoryRouter><PublicGroups/></MemoryRouter></AppContext.Provider>);expect(html).toContain('Public N5');expect(html).not.toContain('Private N5');expect(html).not.toContain('HIDDEN');});
