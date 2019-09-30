/* RESPONSIVE DESKTOP REACT.js VERSION */
import React, {Component} from 'react'

import FileIcon from './FileIcon'
import Colors from '../constants/Colors';
import Utils from '../constants/Utils';

import {Dimmer, Header, Icon, Button, Grid, Image, Loader} from 'semantic-ui-react';
import Searcher from '../components/Searcher';
      


const isDisplayableImage = (file) => {
    const {contentType} = file
    let splMime = contentType && contentType.split('/')
    let extensions = ["jpg", "png", "gif", "bmp"]
    for (var i of extensions) {
        if (splMime[1] === i)
            return true
        else if (i === "bmp")
            return false
    }
}

/**
 * @title ResponsiveDesktop React Component
 * @dev Compute a dynamic and responsive desktop with clickable folders and files icons displaying type of files depending on mimetypes
 * @notice PROPS
 *  - data [array_of_files] *required* : an array of files to rank and display
 *      file keys list : 
 *          - 'originalname' || 'givenName' : the name of the file to display
 *          - 'contentType' : is the mime type of the file 
 *          - 'key' : The s3 'key' prop of the file used for fetching file's url (via server's api)
 *          - folder *optional* : the folder where the file sits in (will fallback to "root")
 *      file example : {
 *          originalname: 'shot_23424234.png',
 *          givenName: 'cake time !,
 *          key: '433dF34s4-RF3tH-RZR_SFrED-T5Eg1',
 *          contentType: 'image/png',
 *          folder: 'Birthday 2019'
 *      }
 * 
 *  - borderColor (string) *required* : a theme color for the desktop header and border
 *  - _onDeleteFile (function) *required* : a function called each time a file deletation request occurs
 *  - _onDeleteFolder (function) *required* : idem "_onDeleteFile" but for folders only
 *  - _resetforceDataChange (function) *notice: REQUIRED IF "forceDataChange" IS SET TO TRUE, * *optional* : function called after component has updated with "forceDataChange" prop to true (avoids infinite loop)  
 *  - forceDataChange (bool) *optional* : indicate desktop that datas must be reloaded in any case (dont forget to provide a "_resetforceDataChange" prop)
 */
export default class ResponsiveDesktop extends Component {

/*-----------------------------*[ ORIGINAL STATE ]*-----------------------------*/
    constructor() {
        super()

        this.state = {
            loading : true,
            personalDb: undefined,
            gridContent: undefined,
            openedFolder: undefined,
            openedFile: undefined,
            editingFolder: undefined,
            editingFile: undefined
        }

        this.closeEditions = this.closeEditions.bind(this)
        this.copyToClipboard = this.copyToClipboard.bind(this)
        this.browseBack = this.browseBack.bind(this)

    }

    
    

    // editSearchList = (searchList) => {
    //     if (this.state.isSearching) {
    //         if (Utils.hasLen(searchList)) {
    //             console.log('searchList has been computed', searchList)
    //         } else {
    //             console.log('there is no result to search')
    //         }
    //     }
    // }
    // // responsible for setting 'isSearching prop'
    // updateSearch = search => {
    //     let isSearching = Utils.hasLen(search)
    //     this.setState({isSearching})
    // }


/*-----------------------------*[ Icons, Ranking, Grid Computation methods ]*-----------------------------*/

    /**
     * @dev Rank initial data prop by folders
     * @return {object}
     */
    rankByFolders = async(data) => {
        var RankedData = {}

        for (var doc of data) {
            const { folder } = doc
            const _folder_ = folder || 'root'
            let rd = RankedData[_folder_]
            
            let content = 
                typeof rd !== 'undefined'
                ? rd.concat(doc)
                : [doc];
            
            RankedData[folder || 'root'] = content;
            
            if (doc === data[data.length-1]) {
                return (RankedData)
            }
        }
    }

    /**
     * @dev Fallback for displaying files: if a file cant be opened by expo Linking library, then check if
     *  - doc is an image -> display image
     *  - doc is a video -> display video
     *  - doc is not supported -> display not supported message
     */
    fileDisplayFallback = () => {
        const { openedFile } = this.state
        const isImage = isDisplayableImage(openedFile)
        const height= window.innerHeight;
        const width= window.innerWidth;
        const resz = size => parseInt(size * 0.8)

        return(
            //openedFile.contentType.indexOf('image') >= 0
            isImage
            ? <img 
                alt=""
                width={parseInt(window.innerWidth * 0.8)}
                height="auto"
                src={{uri: openedFile.url}} 
                placeholder={`Ouverture de ${openedFile.givenName || openedFile.originalname}...`}    
            />
            : (
                openedFile.contentType.indexOf('video') >= 0
                ? <video
                    src={{uri: openedFile.url}} 
                    autoplay={false}
                    controls={true}
                    width={resz(width)} 
                    height={resz(height)}  
                />
                : <p style={{...styles.negativeText, ...styles.centered}}>Affichage de {openedFile.givenName || openedFile.originalname} Impossible</p>
            )
        )
    }

    /**
     * @dev Copy to Clipboard handler
     */
    copyToClipboard = async(file) => {
        // console.log(file)
        // let {response:url} = await this.readFile(file)
        // var dummy = document.createElement("input");
        // // to avoid breaking orgain page when copying more words
        // // cant copy when adding below this code
        // // dummy.style.display = 'none'
        // document.body.appendChild(dummy);
        // //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
        // dummy.setAttribute('value', url)
        // dummy.select();
        // document.execCommand("copy");
        // document.body.removeChild(dummy); 
        // console.log('copied to clipboard')
    }

    /**
     * @dev File Reader - Get request to our server that will return a pre-signed url
     */
    readFile = (file) => {
        return new Promise(async (resolve) => {
            let url = await Utils.fetchApi({
                body: {key:file.key, contentType:file.contentType},
                request: 'readFile',
                method: 'POST'
            })

            //console.log('readFile', url)

            resolve(url)
        })
    } 

    /**
     * @dev Display file - 
     *  Check if file can be opened before proceeding else use fileDisplayFallback method
     */
    displayFile = () => {
        const {openedFile, openingFile} = this.state
        const width = window.innerWidth
        if (openedFile) {
            window.open(openedFile.url, 'width=')
            return <Header as="h2" style={{width, height: window.innerHeight}} className="flexy flexCenter">
                Fichier ouvert dans votre navigateur
            </Header>
        }
        else if (openingFile) 
            return <Loader>{`Récupération de ${openingFile}...`}</Loader>

    }


    /**
     * @dev File Editor (longPress handler)
     */
    displayFileEdition = () => {
        const { editingFile } = this.state
        const {givenName, originalname, contentType} = editingFile || {}
        const _split = contentType ? contentType.split('/') : ['*', 'inconnu']
        const { _onDeleteFile } = this.props
        const white = {color: '#fff'}

        if (editingFile) {
            return(
                <div>
                    <Dimmer active={true} inverted>
                        <div style={styles.centered}>
                            <h2 className="ui header" style={{color: Colors.anthracite}}>
                                {this.fileIcon(contentType)}
                                <div className="content">
                                    {givenName || originalname}
                                    <div className="sub header">{`fichier ${_split[1]} (${_split[0]})`}</div>
                                </div>
                            </h2>
                            {/* <Header>
                                {this.fileIcon(contentType)}
                                <Header.Subheader>
                                    {`fichier ${_split[1]} (${_split[0]})`}
                                </Header.Subheader>
                                {givenName || originalname}
                            </Header> */}
                            <div style={{...styles.centered, ...styles.margedBottom}}>

                                <Button 
                                    style={{color: 'white', backgroundColor: Colors.quetzalGreen, marginRight: 5}}
                                    onClick={() => this.copyToClipboard(editingFile)}
                                    icon={<Icon type="font-awesome" name="clipboard" style={{color: '#fff'}}/>}
                                >
                                    Copier le lien
                                </Button>

                                <Button  
                                    style={{color: 'white', backgroundColor: Colors.cyan, marginRight: 5}}
                                    onClick={() => this.openFile(editingFile)}
                                    //icon={{name: "close", ...white}}
                                    icon={<Icon type="entypo" name="download" color={white.color} />}
                                >Ouvrir</Button>

                                <Button 
                                    onClick={() => _onDeleteFile(editingFile)}
                                    icon={<Icon type="antdesign" name="delete" color={white.color} />} 
                                    style={{...styles.editionButtonContainer, ...styles.editionButton, backgroundColor: Colors.errorBackground, marginRight: 5}}                                >
                                    Supprimer
                                </Button>
                            </div>
                            
                            <Button 
                                style={{backgroundColor: Colors.anthracite, marginTop: 10, color: Colors.amcred, fontWeight: 'bold'}}
                                onClick={this.closeEditions}
                            >
                                Fermer
                            </Button>

                        </div>
                    </Dimmer>
                </div>
            )
        }
    }

    /**
     * @dev Folders editor (longPress handler)
     */
    displayFolderEdition = () => {
        const { editingFolder, rankedByFolders } = this.state
        const { _onDeleteFolder } = this.props
        const folderFilesCount = (rankedByFolders && editingFolder && rankedByFolders[editingFolder]) ? rankedByFolders[editingFolder].length : 0

        if (editingFolder) {
            return(
                <div>
                    <Dimmer active={true} inverted>
                        <div style={styles.centered}>
                            <h2 className="ui header" style={{color: Colors.anthracite}}>
                                <i aria-hidden="true" class="folder open icon"></i>
                                <div className="content">
                                    {editingFolder}
                                    <div className="sub header">{`Contient ${folderFilesCount} fichier${folderFilesCount > 1 ? 's' : ''}`}</div>
                                </div>
                            </h2>
        
                            <div style={{...styles.centered, ...styles.margedBottom}}>
                                

                                <Button  
                                    style={{color: 'white', backgroundColor: Colors.quetzalGreen}}
                                    onClick={() => this.openFolder(editingFolder)}
                                    //icon={{name: "close", ...white}}
                                >
                                    <Icon type="entypo" name="download" style={{color: '#fff'}} />
                                    Ouvrir
                                </Button>

                            <Button 
                                style={{backgroundColor: Colors.amcred}}
                                onClick={this.closeEditions}
                            >
                                <span style={{color: "#fff"}}>Fermer</span>
                            </Button>
                                
                            </div>

                            <Button 
                                    style={{...styles.editionButtonContainer, ...styles.editionButton, backgroundColor: Colors.errorBackground, marginRight: 5}}
                                    onClick={() => _onDeleteFolder(editingFolder)}
                                    icon={<Icon type="antdesign" name="delete" color="#fff" />} 
                                >
                                    Supprimer
                            </Button>

                            
                        </div>
                    </Dimmer>
                </div>
            )
        }
    }
  
    /**
     * @dev Computes a file icon depending on its mimetype
     */
    fileIcon = (mimeType) => {   // default is 'default.png' (unknown/'APP')
        /* all types */
        const types = {"application":true, "audio":true, "image":true, "text":true, "video":true}
        /* all extensions icons */
        const extensions = {
            "css":true, "doc":true, "html":true, "jpg":true, "mp3":true, "mp4":true, "pdf":true, "png":true, "xls":true
        };
        const MT = mimeType.split('/')
        /* use extensions[MT[1]] if existing */
        /* else use application if existing, else fallback to default icon */
        const usedExt = 
            extensions[MT[1]] 
            ? MT[1] 
            : (
                types[MT[0]]
                ? MT[0]
                : 'default'
            )
        return(
           <FileIcon extension={usedExt} />
        )   
    }

    /**
     * @dev longPress event mocker
     */
    handleLongPress = ({longPress, press}) => {
        this.setState({isPressing: true})
        setTimeout(() => {
            const {isPressing} = this.state
            isPressing
            ? longPress()
            : press()
        }, 500)

        
    }

    handleMouseUp = () => {
        this.setState({isPressing: false})
    }

    /**
     * @dev Compute a file or folder icon 
     */                                                                                 // onClick={pressHandler} onDoubleClick={() => type === 'folder' ? this.editFolder(item) : this.editFile(item)}
    desktopIcon = ({type, item, pressHandler}) => <div className="overable" onMouseDown={() => this.handleLongPress({longPress: () => type === 'folder' ? this.editFolder(item) : this.editFile(item), press: pressHandler})} onMouseUp={this.handleMouseUp}>
        <div 
            style={styles.folderIcon}
        >
            {
                type === 'file'
                ? this.fileIcon(item.contentType)   /* (this.state.openedFolder&&this.state.openedFolder===item) ? "folder" : "folder" */
                : <Icon type="material-community" name="folder" style={{color:Colors.desktopFolders}} size="huge" /> 
            }

            <p style={type === 'file' ? styles.fileTitle : styles.folderTitle}>{ Utils.cutText(typeof item === 'string' ? item : (item.givenName || item.originalname)) }</p>
        </div>
    </div>

    /**
     * @dev Folder Renderer
     */
    renderFolder = ({item}) => (
        (item !== 'root') 
        && this.desktopIcon({item, type:'folder', pressHandler: () => { this.openFolder(item); }})
    )

    /**
     * @dev File Renderer
     */
    renderFile = ({item}) => (
        this.desktopIcon({item, type: 'file', pressHandler: () => { this.openFile(item); } })
    )

    /**
     * @dev Computes Icons from ranked data (should be 'rankedByFolders' state)
     */
    iconsFromRankedData = async(rankedData) => {
        const {openedFolder} = this.state
        let folders = await Promise.resolve(
            typeof rankedData === 'object' && !rankedData.length && Object.keys(rankedData)
        )
        let isOpeningFolder = await Promise.resolve(
            (openedFolder && folders.length === 1 && folders[0] === openedFolder)
        )
        let files = await Promise.resolve(
            rankedData.root || (isOpeningFolder ? rankedData[openedFolder] : rankedData)
        )

        let foldersMap = // display folders only if there is no openedFolder
            isOpeningFolder
            ? []                              
            : await Promise.resolve(folders && folders.length ? folders.map((item) => this.renderFolder({item})) : []) 
        let filesMap = await Promise.resolve(files && files.length ? files.map((item) => this.renderFile({item})) : [])

        let noEmptyFolders = await Promise.resolve(foldersMap.filter((fm) => fm!==false))

        let icons = await Promise.resolve(
            noEmptyFolders.concat(filesMap)
        )

        return icons
    }

    /*-----------------------------*[ State Setters / Press Handlers ]*-----------------------------*/
    browseBack = () => {
        ///
        const {browsingFolder, openedFile} = this.state
        const folderIsOpen = openedFile ? browsingFolder : false
        this.setState({openedFolder: folderIsOpen, browsingFolder: folderIsOpen, openedFile: false, forcedUpdate : true})
        ///   
    }

    closeEditions = () => this.setState({editingFile: false, editingFolder: false})

    openFile = async(openedFile) => {
        this.setState({openingFile: openedFile.givenName || openedFile.originalname})
        let fetchedUrl = await this.readFile(openedFile);
        let url = await Promise.resolve(fetchedUrl.error ? undefined : fetchedUrl.response)
        this.setState({openedFile:{...openedFile, url}, openingFile: false})
    }

    openFolder = (openedFolder) => {        
        this.setState({openedFolder})
    }

    editFile = (_file) => {
        this.setState({editingFile: _file})
    }

    editFolder = (_folder) => {
        this.setState({editingFolder: _folder})
    }

    /*-----------------------------*[ SEARCHER ]*-----------------------------*/
    onUpdateSearch = (_search) => {
        const isSearching = Utils.hasLen(_search)

        this.setState({isSearching, forcedUpdate: this.state.isSearching && !isSearching})
    }

    onSearchResult = async(searchResult) => {    
        if (this.state.isSearching) {

            if (Utils.hasLen(searchResult)) {
                let {gridContent, rankedByFolders} = await this.createGridContentFromData(searchResult)
                this.setState({gridContent, rankedByFolders})

            } else {
                this.setState({gridContent:<Grid.Row className="centered"><p>Pas de résultat</p></Grid.Row>})
            }

        }
    }
    
    setDatabaseSearcher = (_data) => {
        const searcher = <Searcher 
            data={_data}
            dataLen={_data && _data.length}
            dataName="document"
            className="marginVertical"
            editList={this.onSearchResult.bind(this)} 
            onUpdateSearch={this.onUpdateSearch.bind(this)}
        />

        global.appBarSetter({searcher}, process.env.REACT_APP_DATABASE_MAGIC)
    }

    /*-----------------------------*[ FLOW ]*-----------------------------*/

    async componentDidMount() {
        const {data, personalDb} = this.props
        let {gridContent, rankedByFolders} = await this.createGridContentFromData(data)
        this.setState({loading: false, gridContent, rankedByFolders, personalDb, browsingTree: 'racine   >   '})
        this.setDatabaseSearcher(data)

    }

    async componentDidUpdate() {
        const {data, personalDb, forceDataChange, _resetforceDataChange} = this.props
        const {openedFolder, forcedUpdate, browsingFolder, resetSearcher} = this.state
        
        // case: data props changed 
        if (this.state.personalDb !== personalDb) {
            let {gridContent, rankedByFolders} = await this.createGridContentFromData(data)
            this.setState({gridContent, personalDb, rankedByFolders, browsingFolder:false, openedFolder: false, openedFile: false, resetSearcher: true})
        }
        // case: database requested a data reset (reload after a file/folder has been removed)
        else if (forceDataChange) {
            _resetforceDataChange();
            
            
            let {gridContent, rankedByFolders} = await this.createGridContentFromData(data)
            this.setState({gridContent, rankedByFolders, openedFolder: browsingFolder, browsingFolder:false, openedFile: false, editingFile: false, editingFolder: false, resetSearcher: true})

        // case: an open folder request has occured
        } else if (openedFolder) {
            let {gridContent} = await this.createGridContentFromData(data.filter(item => item.folder && item.folder === openedFolder))
            this.setState({gridContent, openedFolder:false, browsingFolder: openedFolder})

        } else if (forcedUpdate) {  // used by browseBack method
            let {gridContent, rankedByFolders} = await this.createGridContentFromData(data)
            
            this.setState({gridContent, rankedByFolders, forcedUpdate:false, openedFolder: browsingFolder, browsingFolder:false, editingFile: false, editingFolder: false})

        } else if(resetSearcher) {
            this.setDatabaseSearcher(data)
            this.setState({resetSearcher: false})
        }

    }

    createGridContentFromData = (_data) => {
        return new Promise(async(resolve) => {
            try {
                if(!_data) 
                    resolve({gridContent:<Grid.Column width={16}><p className="flexy flexCenter">La base de données {this.props.personalDb ? 'privée' : 'entreprise'} est vide</p></Grid.Column>})

                let rankedByFolders = 
                    _data.length
                    ? await this.rankByFolders(_data)
                    : _data
                let allIcons = await this.iconsFromRankedData(rankedByFolders)
                let gridContent = await Promise.resolve(
                    allIcons.map((icon) => <Grid.Column width={2} key={Utils.keyExtractor()}>{icon}</Grid.Column>)
                )
                resolve({gridContent, rankedByFolders})

            }catch(e) {
                console.warn(`ERROR -> ResponsiveDesktop.js -> createGridContentFromData -> ${e}`)
                resolve({gridContent:<Grid.Row><p style={{...styles.negativeText, ...styles.centered}}>Chargement du bureau impossible</p></Grid.Row>})
            }
        })
    }


    render() {
        
        const {loading, gridContent, openedFile, openingFile, editingFile, editingFolder, browsingFolder} = this.state   
        const {borderColor} = this.props
        const {givenName, originalname} = openedFile || {}
        const browsingTree = 
        `racine   >   ${browsingFolder || ''}   ${browsingFolder ? '>' : ''}   ${openedFile ? (givenName || originalname) : ''}`

        const header = /* Header containing browsing tree */
            <Header 
                style={{backgroundColor: borderColor, height: 30}} 
            >
                <Image className="overable" floated="left" onClick={this.browseBack}><Icon type="material" name="angle left" style={{color:"white"}} /></Image>
                <p style={{ color: '#fff', ...styles.shadowed, marginTop: 10 }}>{browsingTree}</p>
            </Header>

        return(
            loading 
            ? <Loader />
            : (
                openedFile || openingFile
                ? <div>
                    {header}
                    {this.displayFile()}
                </div>
                : (
                    editingFile
                    ? this.displayFileEdition()
                    : (
                        editingFolder
                        ? this.displayFolderEdition()
                        : <div>
                            {header}
                            
                            
                            <Grid>{gridContent}</Grid>
                            
                        </div>
                    )
                )
            )
        )

    }

}

const styles = {
    folderIcon: {
        textAlign:'center', 
        height: 115, 
        width: '100%', 
        //maxWidth: 75, 
        margin:0
    },
    folderTitle: {
        textAlign: 'center', 
        height: 50
    },
    fileTitle: {
        textAlign: 'center', 
        height: 50
    },
    flatListContainer: { 
        flex: 1, 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        margin: 1 
    },
    searcherContainer: {
        borderTopLeftRadius: 5, 
        borderTopRightRadius: 5, 
        height: 60
    },
    editionButton: {
        justifyContent: 'center' 
    },
    editionButtonContainer: {
        justifyContent: 'center', 
        marginVertical: 10,
        marginHorizontal: 25
    },
    negativeText: {
        fontWeight:'bold',
        color: Colors.amcred
    },
    centered : {
        justifyContent:'center',
        textAlign:'center'
    },
    fullcenter : {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    smallTitleText:{
        fontWeight:'bold',
        fontSize:15
    },
    margedBottom : {
        marginBottom: 10
    },
    shadowed : {
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 5
    },
  
}
