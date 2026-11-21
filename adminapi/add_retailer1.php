<?php
ob_start();
error_reporting(0);
include("connect.php");
include("distributor-session-check.php");
date_default_timezone_set('Asia/Calcutta');
$da=date("Y-m-d");
mysqli_set_charset($con, 'utf8');
header( 'Content-Type: text/html; charset=utf-8' ); 
if(isset($_POST['pname']))
{
	$revert=$_POST['revertval'];
	$pname=mysqli_real_escape_string($con,$_POST['pname']);
	$pnamehindi=mysqli_real_escape_string($con,$_POST['pnamehindi']);
	$beatvalue=$_POST['beatvalue'];
	$pphone=$_POST['pphone'];
	$paddress=mysqli_real_escape_string($con,$_POST['paddress']);
	$paddresshindi=mysqli_real_escape_string($con,$_POST['paddresshindi']);
	$party_outstanding=isset($_POST['party_outstanding']) ? $_POST['party_outstanding'] : '0';
	$pgstin=$_POST['pgstin'];
	$pstate=$_POST['pstate'];
	$ppanno=$_POST['ppanno'];
	$partytype=$_POST['partytype'];
	$pcode=$_POST['pcode'];
	$dln_no=$_POST['dln_no'];
	$p_dob=$_POST['p_dob'];
	$owner_name=$_POST['owner_name'];
	$place_supply11=$_POST['placesupply'];
	$placecountry = isset($_POST['placecountry']) ? $_POST['placecountry'] : 'India';
	$place_currency = isset($_POST['place_currency']) ? $_POST['place_currency'] : 'INR';
	$latitude=$_POST['latitude'];
	$longitude=$_POST['longitude'];
	$shipaddress=mysqli_real_escape_string($con,$_POST['shipaddress']);
	$shipaddresshindi=mysqli_real_escape_string($con,$_POST['shipaddresshindi']);
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$check_flag=0;
	if($pphone!='')
	{
		$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_party where distributor_id='$session_dist_ver' and party_phone='$pphone'");
		if(mysqli_num_rows($res_product_stock)>0)
			$check_flag=1;
	}
	if($check_flag==0)
	{ 												
		$query = mysqli_query($con,"INSERT IGNORE INTO tbl_party(party_name,party_phone, distributor_id, gstin_no,party_address,tb_insertdatetime, tb_inserttime,group_name, state_name,pan_it_no,place_of_supply,party_code,`DLN_no`,`party_type`,`dob`,`owner_name`,`party_ship_address`,`beat_detail`,`password`,`party_latitude`,`party_longitude`,`party_name_hindi`,`address_hindi`,`ship_address_hindi`,`outstanding_amount`,country,currancy)values('$pname','$pphone','$session_dist_ver','$pgstin','$paddress','$cdate','$scri','Sundry Debtors','$pstate','$ppanno','$place_supply11','$pcode','$dln_no','$partytype','$p_dob','$owner_name','$shipaddress','$beatvalue','$pphone','$latitude','$longitude','$pnamehindi','$paddresshindi','$shipaddresshindi','$party_outstanding','$placecountry','$place_currency')");
		$party_id = mysqli_insert_id($con);
		$kl=1;
		$res = mysqli_query($con,"select * from tbl_user where distributor_id='$session_dist_ver' and status in ('Active','Deactive')");
		while($fetch_product=mysqli_fetch_assoc($res))
		{ 
			$fetch_pro="ptyuser".$kl;
			$temp_1=$_POST[$fetch_pro];
			if($temp_1!='')
			{
				$query11 = mysqli_query($con,"INSERT IGNORE INTO tbl_party_user(party_id, user_id,insert_date)values('$party_id','$temp_1','$cdate')");
			}
			$kl++;
		}
		if($party_outstanding>0)
		{
			include("sale-purchase-balance-effect-class.php");
			$CashCollection=new Collectionbalance();
			$collections=$CashCollection->salecollection($session_dist_ver,$party_outstanding,$cdate,$party_id);
		}										
	}			
	else
	{ 
		$res_product_check = mysqli_query($con,"SELECT * FROM  tbl_party where party_phone='$pphone' and distributor_id='$session_dist_ver' and status!='Active'");
		if(mysqli_num_rows($res_product_check)>0)
		{
			$res_update = mysqli_query($con,"UPDATE tbl_party set status='Active' where party_phone='$pphone' and distributor_id='$session_dist_ver' and status!='Active'");
			?>
			<?php
		}
		else 
		{
		}
	}	
	if ($query==1){
		echo $query;
	}
	else{
		echo 0;
	}
}

?>