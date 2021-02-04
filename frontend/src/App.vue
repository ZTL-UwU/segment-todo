<template>
  <div>
    <el-row>
      <el-col :span="5" class="left-screen">
        <el-menu
          background-color="#545c64"
          text-color="#ffffff"
          active-text-color="#ffffff"
        >
          <el-menu-item
            v-for="(item, i) in this.active_list"
            :key="i"
            :index="i"
            @click="look(item.name)"
          >
            <span slot="title" class="text-bold">
              <i class="el-icon-menu" />
              {{ item.name }}
            </span>
          </el-menu-item>
          <el-menu-item index="new" @click="add_list">
            <span slot="title" class="text-bold">
              <i class="el-icon-plus" />
              Create Todo List
            </span>
          </el-menu-item>
          <el-submenu index="achieved">
            <span slot="title" class="text-bold">
              <i class="el-icon-check" />
              Achieved Todo Lists
            </span>
            <el-menu-item
              v-for="(item, i) in this.achieved_list"
              :key="i"
              :index="`'ach-'${i}`"
              @click="look(item.name)"
            >
              <span slot="title" class="text-bold">
                <i class="el-icon-menu" />
                {{ item.name }}
              </span>
            </el-menu-item>
          </el-submenu>
        </el-menu>
      </el-col>
      <el-col :span="19" class="right-screen">
        <div>
          <el-progress
            :percentage="process"
            :format="() => ''"
            v-if="!first_entry"
            class="process-bar"
          ></el-progress>
          <h1 class="list-name">
            {{ todo_list.name }}
            <el-tag type="success" v-if="todo_list.finished">Achieved</el-tag>
          </h1>
          <el-card class="list" v-if="!first_entry">
            <el-collapse v-model="open_item" v-for="(item, i) in todo_list.list" :key="i">
              <el-collapse-item :name="i" :disabled="item.finished">
                <template slot="title">
                  <el-checkbox
                    v-model="item.finished"
                    @change="finish_item(i, item.finished)"
                    class="finished-checkbox"
                  ></el-checkbox>
                  {{ item.title }}
                  <span class="importance-icon">
                    <i
                      v-for="i of Math.min(item.importance, 10)"
                      :key="i"
                      class="el-icon-warning-outline"
                    ></i>
                  </span>
                </template>
                <pre>{{ item.content }}</pre>
                <el-button
                  icon="el-icon-edit"
                  class="edit-button"
                  @click="show_edit_item(i)"
                  circle
                ></el-button>
              </el-collapse-item>
            </el-collapse>
            <el-button-group class="list-bottom-button">
              <el-button @click="show_add_item" type="primary">
                <i class="el-icon-plus" />
                Create New Item
              </el-button>
              <el-button @click="achieve_list" :type="achieve_button_color" :plain="achieve_button_style">
                <i class="el-icon-check"></i>
                Achieve
              </el-button>
            </el-button-group>
            <el-button
              @click="collapse_all_item"
              icon="el-icon-minus"
              v-if="this.open_item.length != 0"
              class="collapse-button"
              circle
            ></el-button>
          </el-card>
          <el-card v-else class="list">
            <div class="box">
              <div class="logo">Segment Todo</div>
              <el-divider />
              <div class="message">Click to a Todo List or create a new one</div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <el-dialog title="Create Todo Item" :visible.sync="add_item_dialog_visible">
      <el-form :model="new_item_form">
        <el-form-item label="Title">
          <el-input
            v-model="new_item_form.title"
            autocomplete="off"
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="Content">
          <el-input
            type="textarea"
            v-model="new_item_form.content"
            autocomplete="off"
            maxlength="1000"
            :autosize="{ minRows: 2 }"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="Importance">
          <br />
          <el-input-number
            v-model="new_item_form.importance"
            :min="0"
            :max="10"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button-group>
          <el-button @click="add_item_dialog_visible = false">Cancel</el-button>
          <el-button type="primary" @click="add_item">Create</el-button>
        </el-button-group>
      </div>
    </el-dialog>

    <el-dialog title="Edit Todo Item" :visible.sync="edit_item_dialog_visible">
      <el-form :model="edit_item_form">
        <el-form-item label="Title">
          <el-input v-model="edit_item_form.title" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="Content">
          <el-input
            type="textarea"
            v-model="edit_item_form.content"
            autocomplete="off"
            maxlength="1000"
            :autosize="{ minRows: 2 }"
            show-word-limit
          ></el-input>
        </el-form-item>
        <el-form-item label="Importance">
          <br />
          <el-input-number
            v-model="edit_item_form.importance"
            :min="0"
            :max="10"
            show-word-limit
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button-group>
          <el-button @click="edit_item_dialog_visible = false">Cancel</el-button>
          <el-button type="primary" @click="edit_item">Edit</el-button>
        </el-button-group>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      active_list: new Array(),
      achieved_list: new Array(),
      todo_list: { list: new Array() },
      add_item_dialog_visible: false,
      new_item_form: {
        title: "",
        content: "",
        importance: 0,
      },
      edit_item_dialog_visible: false,
      edit_item_form: {
        title: "",
        content: "",
        importance: 0,
      },
      edit_id: 0,
      first_entry: true,
      list_id: 0,
      process: 0,
      open_item: new Array(),
    };
  },
  computed: {
    achieve_button_color() {
      return this.process == 100 ? "success" : "info";
    },
    achieve_button_style() {
      return this.process == 100 ? false : true;
    }
  },
  mounted() {
    window.todo_list_change_callback = (val) => {
      this.todo_list = val;
    };
    this.get_list();
  },
  methods: {
    get_list() {
      this.achieved_list = new Array();
      this.active_list = new Array();
      this.$axios
        .get("/api/list")
        .then((res) => {
          for (let x of res.data) {
            if (x.finished == true) {
              this.achieved_list.push(x);
            } else {
              this.active_list.push(x);
            }
          }
        })
        .catch(() => {
          this.$message.error("Server error");
        });
    },
    add_list() {
      this.$prompt("Name", "New Todo List", {
        confirmButtonText: "Add",
        cancelButtonText: "Cancel",
      }).then(({ value }) => {
        value = value.substr(0, 50);

        this.$axios
          .post(`/api/list/${value}`)
          .then(() => {
            this.$message.success("Success");
            this.get_list();
          })
          .error(() => {
            this.$message.error("Server error");
          });
      });
    },
    check_process() {
      let a = 0;
      let f = 0;

      for (let i of this.todo_list.list) {
        if (i.finished == true) {
          f += 1;
        }
        a += 1;
      }

      if (a == 0) {
        this.process = 0;
      } else {
        this.process = (f / a) * 100;
      }
    },
    show_add_item() {
      this.new_item_form = {
        title: "",
        content: "",
        importance: 0,
      };
      this.add_item_dialog_visible = true;
    },
    add_item() {
      this.add_item_dialog_visible = false;
      this.$socket_io.emit("add", this.new_item_form);
    },
    finish_item(index, tar_finished) {
      let req = {
        title: this.todo_list.list[index].title,
        content: this.todo_list.list[index].content,
        importance: this.todo_list.list[index].importance,
        finished: tar_finished,
      };
      this.$socket_io.emit("edit", index, req);
      this.open_item.splice(this.open_item.indexOf(index), 1);
    },
    look(name) {
      this.first_entry = false;
      for (let i in this.active_list) {
        if (this.active_list[i].name == name) {
          this.list_id = i;
          break;
        }
      }

      this.$socket_io.emit("look", name);
    },
    show_edit_item(index) {
      this.edit_id = index;
      this.edit_item_form = {
        title: this.todo_list.list[index].title,
        content: this.todo_list.list[index].content,
        importance: this.todo_list.list[index].importance,
        finished: this.todo_list.list[index].finished,
      };
      this.edit_item_dialog_visible = true;
    },
    edit_item() {
      this.edit_item_dialog_visible = false;
      this.$socket_io.emit("edit", this.edit_id, this.edit_item_form);
    },
    achieve_list() {
      this.$confirm(
        "This operation will achieve this Todo list, Sure? (The log can still be found in the backend json file)",
        "Warning",
        {
          confirmButtonText: "Confirm",
          cancelButtonText: "Cancel",
          type: "warning",
        }
      ).then(() => {
        this.$message({
          type: "success",
          message: "Achieved",
        });
        this.get_list();
        this.first_entry = true;
        this.$socket_io.emit("achieve_list");
      });
    },
    collapse_all_item() {
      this.open_item = new Array();
    },
  },
  watch: {
    todo_list() {
      this.check_process();
    },
  },
};
</script>

<style>
body {
  margin: 0;
}

.left-screen {
  background-color: #545c64;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: scroll;
}

.right-screen {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: scroll;
}

.list {
  margin: 80px;
  margin-top: 20px;
}

.finished-checkbox {
  margin-right: 30px !important;
}

.logo {
  color: #909399;
  font-size: 5em;
}

.message {
  color: #909399;
  font-size: 1em;
  font-weight: 100;
}

.box {
  text-align: center;
}

.process-bar {
  margin-left: 60px;
  margin-right: 60px;
}

.list-name {
  margin-left: 80px;
  margin-right: 80px;
  color: #606266;
}

.importance-icon {
  margin-left: 20px;
  color: #f56c6c;
}

.edit-button {
  float: right;
}

.list-bottom-button {
  margin-top: 20px;
}

.collapse-button {
  float: right;
  margin-top: 20px;
}
</style>
