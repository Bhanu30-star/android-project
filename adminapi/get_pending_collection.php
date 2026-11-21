<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$ver = $_POST['distributor_id'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
			
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$executive=array();
	$res = mysqli_query($con,"SELECT sum(tbl_party_transaction.final_amt) as tamt,sum(tbl_party_transaction.cash_amount) as ramt,tbl_user.user_name FROM tbl_party_transaction,tbl_user where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.payment_mode='Credit' and tbl_user.distributor_id='$ver' group by tbl_user.user_name");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product2=mysqli_fetch_assoc($res))
		{
			$executive['fse_name']=$fetch_product2['user_name'];
			$executive['total_amount']=$fetch_product2['tamt'];
			$executive['received_amount']=$fetch_product2['ramt'];
			$executive['pending_amount']=$fetch_product2['tamt']-$fetch_product2['ramt'];
			$response['executive'][]=$executive;
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
			
		$response['success']='0';
		$response['details']="Data not available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>