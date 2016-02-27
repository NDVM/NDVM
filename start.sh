#!/usr/bin/env bash

##
## start.sh developed by Henrique Lechner < hlechner Θ gmail · com > - 2016
##
## Part of NDVM software: https://github.com/NDVM/NDVM
##

## configurable variables:
nodejs_version_recommended="v0.9.3"

nodejs_version_oldest="v0.7.1"
nodejs_version_oldest_REG="^v0\.([0-6]\.[0-9]{1,3}|7\.0)$"
nodejs_version_newest="v0.9.3"


## bash colors:
bash_red='\e[1;31m'
bash_blue='\e[1;34m'
bash_reset='\e[0m'
bash_purple='\e[1;35m'
bash_und_yellow='\e[4;33m'
bash_underline='\e[4m'

## bash messages:
error_msg="$bash_red""[ERROR]""$bash_reset"
ok_msg="$bash_blue""[OK]""$bash_reset"
info_msg="$bash_purple""[INFO]""$bash_reset"

## check the ndvm path
startsh_path=$(readlink -f "$BASH_SOURCE")
ndvm_path=$(dirname "$startsh_path")

## default variables values
dependence_error=false
ignore_dependence_check=false
ignore_terminal_check=false
nodejs_debug=false
ndvm_debug=false
node_command="node"
no_browser=false

startsh_args="$@"

#####
### execndvm(): execute the NDVM
#####
function execndvm()
{
	if [[ -e "$ndvm_path/server/src/server.js" ]]; then
		## Enter on right folder
		cd "$ndvm_path""/server/src"

		## messages
		echo -e "$ok_msg Executing NDVM ..."
		echo -e "$ok_msg Node.JS return:"
		echo

		node_args="server.js"
		if [[ $nodejs_debug == true ]]; then
			node_args="debug $node_args"
		fi
		if [[ $ndvm_debug == true ]]; then
			node_args="$node_args debug"
		fi
		if [[ $no_browser == true ]]; then
			node_args="$node_args nobrowser"
		fi

		## executing NDVM
		$node_command $node_args

	else
		echo -e "$error_msg file: ""$bash_und_yellow""server/src/server.js""$bash_reset"" not found."
	fi
}


#####
### checknvm(): check if nvm is installed and also if the recommended version is installed on it
#####
function checknvm()
{
	if [[ "$nodeinstalled" == false ]] || [[ $($node_command "--version") != "$nodejs_version_recommended" ]]; then
		## check if nvm script exists and source it
		if [[ -e "/usr/share/nvm/init-nvm.sh" ]]; then
			source "/usr/share/nvm/init-nvm.sh"
		elif [[ -e "$HOME/.nvm/nvm.sh" ]]; then
			source "$HOME/.nvm/nvm.sh"
		fi

		if [[ "$nodeinstalled" == false ]]; then
			unset nodeinstalled
			return 0
		fi

		## check if nvm works
		checkapp false nvm
		if [[ "$?" != 0 ]]; then
			echo -e "$info_msg no nvm detected! Consider on install it to use the recommended node version."
			echo "===> Further details please check the nvm page: https://github.com/creationix/nvm"
			return 0
		fi

		if [[ "$(nvm version $nodejs_version_recommended)" == "$nodejs_version_recommended" ]]; then
			echo -e "$info_msg Node Version Manager: changing from $($node_command --version) to $nodejs_version_recommended ..."
			nvm use $nodejs_version_recommended > /dev/null
			checknode
		else
			echo -e "$info_msg $nodejs_version_recommended seems not be installed on nvm, please consider on install it:"
			echo "===> Try: nvm install $nodejs_version_recommended"
			checknode
		fi
	fi
}


#####
### checknodeversion(): check if nodejs it too old
#####
function checknodeversion()
{
	checknvm
	node_version=$($node_command "--version")

	if [[ "$node_version" =~ $nodejs_version_oldest_REG ]]; then
		echo -e "$error_msg Your Node.JS version is too old! please upgrade to a version between \"$nodejs_version_oldest\" and \"$nodejs_version_newest\"."
		echo -e "==> Current version: $node_version"
		echo -e "==> Recommended version: $nodejs_version_recommended\n"
		exit 1
	else
		echo -e "$info_msg Node.JS version: $node_version"
	fi
}



function commandsuggestion()
{
	if [[ "$command_suggestion" ]]; then
		## print the suggested command
		echo -e "===> Try: $bash_underline$package_management $command_suggestion$bash_reset"
		if [[ $additional_msg ]]; then
			echo "===> $additional_msg"
		fi
	fi
}

#####
### distropackage(): suggest the command to install the missing dependence
#####
function distropackage()
{
        ##              [0]    [1]       [2]       [3]       [4]     [5]       [6]       [7]
        apps_default=( "vlc" "ffmpeg" "sqlite3" "xdg-utils" "gzip" "nodejs" "net-tools" "wget" )

        ## distro specific:
        apps_ubuntu=( )
        apps_arch=( [2]="sqlite" )
        apps_mint=( [1]=false )
        apps_freebsd=( [5]="node" [6]=false )
        apps_debian=( [1]=false )


        ## find app index into array
        for index in ${!apps_default[*]}
        do
                if [[ "${apps_default[$index]}" == "$1" ]]; then
                        local array_index=$index
                        break
                fi
        done

        ## check package management and package name
        case $distro in
                arch)
                        package_management="pacman -S"
                        package="${apps_arch[$array_index]}"
                        ;;
                ubuntu)
                        package_management="sudo apt-get install"
                        package="${apps_ubuntu[$array_index]}"
			additional_msg="Make sure that [universe] repository is enabled"
                        ;;
                mint)
                	package_management="sudo apt-get install"
                	package="${apps_mint[$array_index]}"
                	;;
                debian)
                	package_management="sudo apt-get install"
                	package="${apps_debian[$array_index]}"
                	;;
                freebsd)
                	package_management="pkg install"
                	package="${apps_freebsd[$array_index]}"
                	;;
        esac

	if [[ "$package" != false ]]; then
		## if no changes from default: uses default
		if [[ "$package" == "" ]]; then
		        package="${apps_default[$array_index]}"
		fi

		if [[ "$command_suggestion" ]]; then
			command_suggestion="$command_suggestion $package"
		else
			command_suggestion="$package"
		fi
	fi
}


#####
### checkapp(): Check if dependece (application) is already installed
#####
function checkapp()
{
	## $1 = true/false (return error and exit?)
	## $2 = command
	## $3 = default package name

	## messages
	depedence_msg="$bash_und_yellow""$2""$bash_reset"

	## check if the program exists
	if ( ! hash "$2" 2>/dev/null ); then
		## check if should return error message
		if [[ "$1" == true ]]; then
			echo -e "$error_msg dependence: $depedence_msg not installed."

			## check if it has distro instructions
			if [[ "$no_distro" == false ]]&&[[ "$3" ]]; then
				distropackage "$3"
			fi

			dependence_error=true
		fi
		return 1
	else
		return 0
	fi
}


#####
### checknode(): check if nodejs is installed
#####
function checknode()
{
	## messages
	depedence_msg="$bash_und_yellow""node""$bash_reset"

	## check if the nodejs exists and if the command is "node" or "nodejs"
	if ( hash node 2>/dev/null ); then
		node_command="node"
	elif ( hash nodejs 2>/dev/null ); then
		node_command="nodejs"
	else
		## check for node installed only through nvm
		nodeinstalled=false
		checknvm
		if ( hash node 2>/dev/null ); then
			return 0
		fi

		## send error message
		echo -e "$error_msg dependence: $depedence_msg not installed."
		## check if it has distro instructions
		if [[ $no_distro == false ]]; then
			distropackage "nodejs"
		fi

		dependence_error=true
		return 1
	fi
}


#####
### checkdependence(): Check if dependece (file) is already installed
#####
function checkdependence()
{
	## messages
	depedence_msg="$bash_und_yellow""$ndvm_path/$1""$bash_reset"

	if [[ ! -e "$ndvm_path/$1" ]]; then
		echo -e "$error_msg dependence: $depedence_msg does not exist!"

		dependence_error=true
		dependence_not_found+=( "$1" )
		return 1
	fi
}


#####
### checkdistro(): Check which distro is running on system
#####
function checkdistro()
{
	## check if the files used to discover the distro exist
	if [[ -e "/etc/lsb-release" ]]; then
		etc_issue=$(<"/etc/lsb-release")
		no_distro=false
	elif [[ -e "/etc/os-release" ]]; then
		etc_issue=$(<"/etc/os-release")
		no_distro=false
	elif [[ "$(uname)" == "FreeBSD" ]]||[[ "$OSTYPE" == "FreeBSD" ]]; then
		etc_issue="FreeBSD"
		no_distro=false
	else
		no_distro=true
		return 1
	fi

	## check which distro is that
	case "$etc_issue" in
		*DISTRIB_ID=Arch*|*ID=arch*|*ID_LIKE="arch"*)
			distro="arch"
			;;
		*DISTRIB_ID=Ubuntu*|*ID=ubuntu*)
			distro="ubuntu"
			;;
		*DISTRIB_ID=LinuxMint*)
			distro="mint"
			;;
		*ID=debian*)
			distro="debian"
			;;
		FreeBSD)
			distro="freebsd"
			;;
		*)
			no_distro=true
			;;
	esac
}


#####
### display_version(): output version information and exit
#####
function display_version()
{
	echo ""
	echo "Version function not implemented."
	exit 0
}


#####
### display_help(): output help information and exit
#####
function display_help()
{
	echo ""
	echo "Usage: $0 [options]"
	echo
	echo "Options:"
	echo "   -d, debug, --ndvm-debug        activate the NDVM debug"
	echo "   -b, --no-browser               do not open browser on NVM start"
	echo "   -i, --ignore-dependence-check  do not check for dependences"
	echo "   -t, --ignore-terminal-check    do not check for terminal"
	echo "   -n, --nodejs-debug             activate the Node.JS debug"
	echo "   -v, --version                  output version information and exit"
	echo "   -h, --help                     display this help and exit"
	echo
	echo "Documentation at: <https://github.com/NDVM/NDVM/wiki>"
	exit 0
}


#####
### arguments_info(): shows the arguments enabled
#####
function arguments_info()
{
	if [[ $ignore_dependence_check == true ]]; then
		echo -e "$info_msg \"Ignore Dependence Check\" enabled";
	fi

	if [[ $nodejs_debug == true ]]; then
		echo -e "$info_msg \"Node.JS Debug\" enabled"
	fi

	if [[ $ndvm_debug == true ]]; then
		echo -e "$info_msg \"NDVM Debug\" enabled"
	fi
}


#####
### term_check(): scheck if start.sh was executed through terminal
#####
function term_check()
{
	## check if start.sh was not executed through terminal
	if [[ ! -t 0 ]]; then
		## term messages
		term_msg_title="NDVM [start.sh]"
		term_msg_close="\n\n$info_msg Press ANY key to exit... "

		## term commands
		term_ndvm="$startsh_path $startsh_args;"
		term_printf="printf '$term_msg_close';"
		term_wait="read -n1 -r;"

		term_commands="$term_ndvm $term_printf $term_wait"


		## check if xterm is installed on system
		checkapp false xterm
		if [[ "$?" == 0 ]]; then
			## xterm arguments
			xterm_scrollbar="-rightbar -sb -sl 2048"
			xterm_internal_border="-b 5"
			xterm_color="-bg rgb:1d/20/26 -fg rgb:ab/b2/bf"

			# -xrm 'XTerm.VT100.translations: #override <Key>F1: exec-formatted("xdg-open https://github.com/NDVM/NDVM/wiki", SELECT)'

			xterm_args="$xterm_scrollbar $xterm_internal_border $xterm_color"

			## exec xterm
			xterm $xterm_args -title "$term_msg_title" -e "bash" -c "$term_commands"
			exit 0
		else
			checkapp false gnome-terminal
			if [[ "$?" == 0 ]]; then
				gnome-terminal --hide-menubar --window -x "bash" -c "$term_commands"
				exit 0
			else
				checkapp false konsole
				if [[ "$?" == 0 ]]; then
					konsole --name "$term_msg_title" --hide-tabbar --hide-menubar --separate -e "bash" -c "$term_commands"
					exit 0
				fi
			fi
		fi
	fi
}


#####
### start(): main function
#####
function start()
{
	if [[ $ignore_terminal_check == false ]]; then
		term_check
	fi
	## print the arguments enabled
	arguments_info

	if [[ $ignore_dependence_check == false ]]; then
		## check distribution for command suggestion
		checkdistro

		## check for: flock, jorder and jquery files
		checkdependence "common/flock/flock-0.1.3.js"
		checkdependence "client/www/jorder/jorder-1.2.1-min.js"
		checkdependence "client/www/jquery/jquery.js"

		## check if all dependences are installed
		checknode
		checkapp true "vlc"		"vlc"
		checkapp true "ffmpeg"		"ffmpeg"
		checkapp true "sqlite3" 	"sqlite3"
		checkapp true "xdg-open"	"xdg-utils"
		checkapp true "gzip"		"gzip"

		commandsuggestion

		if [[ $dependence_error == false ]]; then
			## check nodejs version
			checknodeversion
		else
			exit 1
		fi
	fi

	## call function execndvm()
	execndvm
}






## dealing with arguments
while [[ "$1" != "" ]]; do
	case "$1" in
		-h|--help)
			display_help
	    		;;
		-v|--version)
			display_version
			;;
		-i|--ignore-dependence-check)
			ignore_dependence_check=true
			;;
		-t|--ignore-terminal-check)
			ignore_terminal_check=true
			;;
		-n|--nodejs-debug)
			nodejs_debug=true
			;;
		-d|debug|--ndvm-debug)
			ndvm_debug=true
			;;
		-b|--no-browser)
			no_browser=true
			;;
		-[a-z]*)
			while getopts ":hvind" opt "$1"; do
				case $opt in
					h)
						display_help
						;;
					v)
						display_version
						;;
					i)
						ignore_dependence_check=true
						;;
					t)
						ignore_terminal_check=true
						;;
					n)
						nodejs_debug=true
						;;
					d)
						ndvm_debug=true
						;;
					b)
						no_browser=true
						;;
					\?)
						echo -e "$error_msg Invalid option: -$OPTARG"
						echo "===> Try '$0 --help' for more information."
						exit 1
						;;
				esac
			done
			;;
		*)
			echo -e "$error_msg Invalid option: $1"
			echo "===> Try '$0 --help' for more information."
			exit 1
			;;
	esac
	shift
done

## call start() function (the main function)
start
