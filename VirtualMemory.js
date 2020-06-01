// In The Name Of Allah

var RootV = new Vue({
    el: "#root",
    methods: {
        configure: function(fs, ms, ps){
            MemoryV.configure(fs, ms);
            DiskV.configure(fs, ps);
            psNumber = ps.length;
            psSize = [];
            for (p of ps)
            {
                psSize.push(p.size);
            }
            CpuV.configure(psNumber, psSize, fs);
            return;
        },
    }
});

var HeaderV = new Vue({
    el: '#header',
    methods: {
        newScene: function(){
            NewSceneModalV.open();
            return;
        }
    },
});

var NewSceneModalV = new Vue({
    el: "#new-scene-modal",
    data: {
        el: "#new-scene-modal",
        frameSize: null,
        memorySize: null,
        processes: [],
        processesNumber: 0
    },
    methods: {
        vNull: function(){
            this.frameSize = null;
            this.memorySize = null;
            this.processes = [];
            this.processesNumber = 0;
            return;
        },
        open: function(){
            this.vNull();
            $(this.el).modal();
            return;
        },
        addProcess: function(){
            p = {
                    number: this.processesNumber, 
                    size: null, 
                    color: this.randomColor()
                };
            this.processes.push(p);
            this.processesNumber++;
            return;
        },
        randomColor: function () {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
              color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        },
        create: function(){
            RootV.configure(this.frameSize, this.memorySize, this.processes);
            $(this.el).modal('hide');
            return;
        },
        cancel: function(){
            this.vNull();
            $(this.el).modal('hide');
            return;
        }
    }
});

var MemoryV = new Vue({
    el: "#memory",
    data: {
        frameSize: null,
        memorySize: null,
        memory: [],
        pageTable: [],
        queue: [],
    },
    methods: {
        vNull: function(){
            this.frameSize = null;
            this.memorySize = null;
            this.memory = [];
            this.pageTable = [];
            this.queue = [];
            return;
        },
        configure: function(fs, ms) {
            this.vNull();
            this.frameSize = fs;
            this.memorySize = ms;
            this.memory = new Array(ms);
            this.pageTable = new Array(ms);
            for (i=0; i < ms; i++)
            {
                this.pageTable[i] = 
                {
                    frame: i,
                    process: null,
                    page: null,
                };
                this.memory[i] = new Array(fs);
                for (j=0; j < fs; j++)
                {
                    this.memory[i][j] = "00000000";
                }
            }
            return;
        },
        getByte: function(process, page, byte){
            for (record of this.pageTable)
            {
                if (record.process == process && record.page == page)
                {
                    return this.memory[record.frame][byte];
                }
            }
            return null;
        },
        setPage: function(process, page, content){
            for (var record of this.pageTable)
            {
                if (record.process == null && record.page == null)
                {
                    Vue.set(this.memory, record.frame, content);
                    record.process = process;
                    record.page = page;
                    Vue.set(this.pageTable, record.frame, record);
                    this.queue.push(record.frame);
                    return record.frame;
                }
            }
            targetFrame = this.queue.shift();
            Vue.set(this.memory, targetFrame, content);
            var record = this.pageTable[targetFrame];
            record.process = process;
            record.page = page;
            Vue.set(this.pageTable, targetFrame, record);
            this.queue.push(targetFrame);
            return targetFrame;
        },

    }
});

var DiskV = new Vue({
    el: "#disk",
    data: {
        processes: [],
    },
    methods: {
        vNull: function(){
            this.processes = [];
            return;
        },
        configure: function(fs, ps){
            this.vNull();
            for (p of ps)
            {
                var content = new Array(p.size);
                for (i=0; i < p.size; i++)
                {
                    content[i] = new Array(fs);
                    for (j=0; j < fs; j++)
                    {
                        content[i][j] = this.randomByte();
                    }
                }
                this.processes.push(Object.assign(p, {content: content}));
            }
            return;
        },
        randomByte: function () {
            var letters = '01';
            var byte = '';
            for (var i = 0; i < 8; i++) {
                byte += letters[Math.floor(Math.random() * 2)];
            }
            return byte;
        },
        getPage: function(processNum, pageNum){
            return this.processes[processNum].content[pageNum];
        },
    }
})

var CpuV = new Vue({
    el: '#cpu',
    data: {
        processesNumber: null,
        processesSize: [],
        pageSize: null,
    },
    methods: {
        vNull: function(){
            this.processesNumber = null;
            this.processesSize = [];
            this.pageSize = null;
            return;
        },
        configure: function(pn, ps, fs){
            this.vNull()
            this.processesNumber = pn;
            this.processesSize = ps;
            this.pageSize = fs;
            return;
        },
        requestAddress: function(){
            randomProcessNumber = Math.floor(Math.random() * this.processesNumber);
            randomPageNumber = Math.floor(Math.random() * this.processesSize[randomProcessNumber]);
            randomByteNumber = Math.floor(Math.random() * this.pageSize);
            return [randomProcessNumber, randomPageNumber, randomByteNumber];
        },
    },
});

var PageTableV = new Vue({
    el: "#page-table",
});

var FifoQueueV = new Vue({
    el: "#fifo-queue",
});

var EventsV = new Vue({
    el: "#events",
    data: {
        events: [],
        address: null,
        delay: 1000,
    },
    methods: {
        vNull: function(){
            this.events = [];
            return;
        },
        start: function(){
            this.vNull();
            this.events.push('START');
            setTimeout(this.cpuRequest, this.delay);
            return;
        },
        cpuRequest: function(){
            var addr = CpuV.requestAddress();
            this.address = addr;
            this.events.push("CPU request: process " + addr[0] + ", page " + addr[1] + ", byte " + addr[2]);
            setTimeout(this.memoryResponse, this.delay, addr);
            return;
        },
        memoryResponse: function(addr){
            byte = MemoryV.getByte(addr[0], addr[1], addr[2]);
            if (byte != null)
            {
                this.events.push("Memory response: " + byte);
                setTimeout(this.end, this.delay);
                return;
            }
            this.events.push("Page Fault");
            setTimeout(this.memoryRequest, this.delay, addr[0], addr[1]);
            return;
        },
        memoryRequest: function(process, page){
            this.events.push("Memory request: process " + process + ", page " + page);
            setTimeout(this.diskResponse, this.delay, process, page);
            return;
        },
        diskResponse: function(process, page){
            var content = DiskV.getPage(process, page);
            this.events.push("Disk response: " + content);
            setTimeout(this.memoryStore, this.delay, process, page, content);
            return;
        },
        memoryStore: function(process, page, content){
            var frame = MemoryV.setPage(process, page, content);
            this.events.push("Memory store page on frame " + frame);
            setTimeout(this.memoryResponse, this.delay, this.address);
            return;
        },
        end: function(){
            this.events.push('END');
            return;
        }
    }
});