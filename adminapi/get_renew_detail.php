<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	$select_user=mysqli_query($con,"SELECT * FROM tbl_distributor where status='Active' and distributor_id='$dis_id'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$plan_name=$fetch_user['plan_name'];
			$opt_plan_type=$fetch_user['plan_type'];
			$opt_plan_id=$fetch_user['plan_id'];
		}
	}
	$select_fos=mysqli_query($con,"SELECT * FROM tbl_user where status!='Deleted' and distributor_id='$dis_id'");
	$num_users=mysqli_num_rows($select_fos);
	$plan_flag=0;
	if($opt_plan_type=="Rental")
	{
		$price = mysqli_query($con,"select * from tbl_bt_payment_plan where plan_status='Active' and plan_type='Rental' and plan_name='$plan_name'");
		while($priceplane= mysqli_fetch_assoc($price))
		{
			$plan_amount=$priceplane['total_charge'];
			$admin_charge=$priceplane['admin_charge'];
			$balance_sheet=$priceplane['balance_sheet'];
		}
		if($admin_charge>0)
			$num_users=$num_users+1;
		$plan_type="Rental";
		$valid_month=0;
		$plan_name="Rental";
	}
	else
	{
		$price = mysqli_query($con,"select * from tbl_bt_payment_plan where plan_status='Active' and plan_type='OneTime' and user_no>='$num_users' limit 1");
		while($priceplane= mysqli_fetch_assoc($price))
		{
			$plan_amount=$priceplane['base_charge'];
			$plan_name=$priceplane['plan_name'];
			$valid_month=$priceplane['valid_month'];
			$plan_type="OneTime";
			$balance_sheet=0;
		} 
	}
	
	$response['fse_count']=$num_users;
	$response['plan_name']=$plan_name;
	$response['plan_amount']=floatval($plan_amount);
	$response['itr_charges']=$balance_sheet;
	$response['valid_month']=$valid_month;
	$response['plan_id']=$opt_plan_id;
	$response['plan_type']=$plan_type;
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>