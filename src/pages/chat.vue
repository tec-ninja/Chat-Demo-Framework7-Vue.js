<template>
<f7-page>
  <f7-navbar title="Messages" />

  <f7-messagebar
    ref="messagebar"
    v-if="isLogged"
    v-model:value="messageText"
    :placeholder="placeholder"
    :attachments-visible="attachmentsVisible"
    :sheet-visible="sheetVisible"
  >
    <template #inner-start>
      <f7-link
        icon-ios="f7:camera_fill"
        icon-aurora="f7:camera_fill"
        icon-md="material:camera_alt"
        @click="sheetVisible = !sheetVisible"
      />
    </template>
    <template #inner-end>
      <f7-link
        icon-ios="f7:arrow_up_circle_fill"
        icon-aurora="f7:arrow_up_circle_fill"
        icon-md="material:send"
        @click="sendMessage"
      />
    </template>
    <f7-messagebar-attachments>
      <f7-messagebar-attachment
        v-for="(image, index) in attachments"
        :key="index"
        :image="image"
        @attachment:delete="deleteAttachment(image)"
      ></f7-messagebar-attachment>
    </f7-messagebar-attachments>
    <f7-messagebar-sheet>
      <f7-messagebar-sheet-image
        v-for="(image, index) in images"
        :key="index"
        :image="image"
        :checked="attachments.indexOf(image) >= 0"
        @change="handleAttachment"
      ></f7-messagebar-sheet-image>
    </f7-messagebar-sheet>
  </f7-messagebar>

  <f7-messages
    v-if="isLogged"
  >
    <f7-messages-title><b>{{date}},</b> {{time}}</f7-messages-title>
    <f7-message
      v-for="(message, index) in messages"
      :key="index"
      :type="message.type"
      :image="message.image"
      :name="message.name"
      :avatar="message.avatar"
      :first="isFirstMessage(message, index)"
      :last="isLastMessage(message, index)"
      :tail="isTailMessage(message, index)"
    >
      <template #text>
        <!-- eslint-disable-next-line -->
        <span v-if="message.text" v-html="message.text"></span>
      </template>
    </f7-message>
    <f7-message
      v-if="typingMessage"
      type="received"
      :typing="true"
      :first="true"
      :last="true"
      :tail="true"
      :header="`${typingMessage.name} is typing`"
      :avatar="typingMessage.avatar"
    ></f7-message>
  </f7-messages>
  <f7-block 
    v-if="!isLogged"
    strong
  >
    <f7-row>
      <f7-col>
        <f7-list
          inline-labels 
          no-hairlines-md
        >
          <f7-list-input
            label="Name"
            type="text"
            placeholder="Your name"
            v-model:value="userName"
            clear-button
          >
            <f7-icon icon="demo-list-icon"></f7-icon>
          </f7-list-input>
        </f7-list>
      </f7-col>
    </f7-row>
    <f7-row>
      <f7-col>
        <f7-button 
          large 
          fill
          @click="setName"
        >
          Join
        </f7-button>
      </f7-col>
    </f7-row>
  </f7-block>
</f7-page>
</template>
<script>
import { f7, f7ready } from 'framework7-vue';
import $ from 'dom7';
import io from 'socket.io-client';

const socket = io('173.205.81.4:80');

export default {
  data() {
    return {
      attachments: [],
      sheetVisible: false,
      typingMessage: null,
      messageText: '',
      users: [],
      userName: '',
      isLogged: false,
      messages: [],
      images: [
        'https://cdn.framework7.io/placeholder/cats-300x300-1.jpg',
        'https://cdn.framework7.io/placeholder/cats-200x300-2.jpg',
        'https://cdn.framework7.io/placeholder/cats-400x300-3.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x150-4.jpg',
        'https://cdn.framework7.io/placeholder/cats-150x300-5.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x300-6.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x300-7.jpg',
        'https://cdn.framework7.io/placeholder/cats-200x300-8.jpg',
        'https://cdn.framework7.io/placeholder/cats-400x300-9.jpg',
        'https://cdn.framework7.io/placeholder/cats-300x150-10.jpg',
      ],
      people: [
        {
          name: 'Kate Johnson',
          avatar: 'https://cdn.framework7.io/placeholder/people-100x100-9.jpg',
        },
        {
          name: 'Blue Ninja',
          avatar: 'https://cdn.framework7.io/placeholder/people-100x100-7.jpg',
        },
      ],
      responseInProgress: false,
    };
  },
  computed: {
    attachmentsVisible() {
      const self = this;
      return self.attachments.length > 0;
    },
    placeholder() {
      const self = this;
      return self.attachments.length > 0 ? 'Add comment or Send' : 'Message';
    },
  },
  mounted() {
    const self = this;
    // f7ready(() => {
    //   self.messagebar = f7.messagebar.get(self.$refs.messagebar.$el);
    // });

    socket.on('connection', () => {
      console.log('connected');
    });

    // When the server emits a message, the client updates message list
    socket.on('read-msg', function(messages) {
      self.messages.push(...messages);
    });

    // When user connects, the server emits user-connected event which updates user list
    socket.on('user-connected', function(userId) {
      self.users.push(userId);
    });

    // Init chat event. Updates the initial chat with current messages
    socket.on('init-chat', function(messages) {
      console.log('inited');
      self.messages = messages;
    });

    // Init user list. Updates user list when the client init
    socket.on('update-users', function(users) {
      self.users = users;
    });
  },
  methods: {
    isFirstMessage(message, index) {
      const self = this;
      const previousMessage = self.messages[index - 1];
      if (message.isTitle) return false;
      if (
        !previousMessage ||
        previousMessage.type !== message.type ||
        previousMessage.name !== message.name
      )
        return true;
      return false;
    },
    isLastMessage(message, index) {
      const self = this;
      const nextMessage = self.messages[index + 1];
      if (message.isTitle) return false;
      if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name)
        return true;
      return false;
    },
    isTailMessage(message, index) {
      const self = this;
      const nextMessage = self.messages[index + 1];
      if (message.isTitle) return false;
      if (!nextMessage || nextMessage.type !== message.type || nextMessage.name !== message.name)
        return true;
      return false;
    },
    deleteAttachment(image) {
      const self = this;
      const index = self.attachments.indexOf(image);
      self.attachments.splice(index, 1)[0]; // eslint-disable-line
    },
    handleAttachment(e) {
      const self = this;
      const index = $(e.target).parents('label.checkbox').index();
      const image = self.images[index];
      if (e.target.checked) {
        // Add to attachments
        self.attachments.unshift(image);
      } else {
        // Remove from attachments
        self.attachments.splice(self.attachments.indexOf(image), 1);
      }
    },
    sendMessage() {
      const self = this;
      const text = self.messageText.replace(/\n/g, '<br>').trim();
      const messagesToSend = [];
      self.attachments.forEach((attachment) => {
        messagesToSend.push({
          image: attachment,
        });
      });
      if (text.length) {
        messagesToSend.push({
          text,
        });
      }
      if (messagesToSend.length === 0) {
        return;
      }

      // Reset attachments
      self.attachments = [];
      // Hide sheet
      self.sheetVisible = false;
      // Clear area
      self.messageText = '';
      // Focus area
      if (text.length) f7.messagebar.get(self.$refs.messagebar.$el).focus();

      self.messages.push(...messagesToSend.map(item => ({...item, type: 'sent'})));

      console.log(self.messages);

      // Send message
      socket.emit('send-msg', messagesToSend.map(item => ({...item, name: self.userName, type: 'received', avatar: ''})));


      // // Mock response
      // if (self.responseInProgress) return;
      // self.responseInProgress = true;
      // setTimeout(() => {
      //   const answer = self.answers[Math.floor(Math.random() * self.answers.length)];
      //   const person = self.people[Math.floor(Math.random() * self.people.length)];
      //   self.typingMessage = {
      //     name: person.name,
      //     avatar: person.avatar,
      //   };
      //   setTimeout(() => {
      //     self.messages.push({
      //       text: answer,
      //       type: 'received',
      //       name: person.name,
      //       avatar: person.avatar,
      //     });
      //     self.typingMessage = null;
      //     self.responseInProgress = false;
      //   }, 4000);
      // }, 1000);
    },
    setName() {
      this.isLogged = true;
      socket.emit('add-user', this.userName);
    }
  },
};
</script>