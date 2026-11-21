<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['terms1']) && isset($_POST['terms2']) && isset($_POST['distributor_id']) && isset($_POST['terms3']) && isset($_POST['terms4']) && isset($_POST['terms5']))
{
	$ver = $_POST['distributor_id'];
	$terms1=$_POST['terms1'];
	$terms2=$_POST['terms2'];
	$terms3=$_POST['terms3'];
	$terms4=$_POST['terms4'];
	$terms5=$_POST['terms5'];
	$terms6=$_POST['terms6'];
	$terms7=$_POST['terms7'];
	$type=$_POST['type'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d")." ".date("H:i:s");
	if($type=="English")
	{
		$rs1=mysqli_query($con,"select * from tbl_dist_terms_conditions where distributor_id='$ver'");
		if(mysqli_num_rows($rs1)>0)
		{
			$check=mysqli_query($con,"SELECT * FROM `tbl_dist_terms_conditions` where distributor_id='$ver'");
	        if(mysqli_num_rows($check)>0)
	        {
	            $fetch_check=mysqli_fetch_assoc($check);
	            $condition_id=$fetch_check['terms_conditions_id'];
	            $hst_term1=$fetch_check['terms_condition1'];
	            $hst_term2=$fetch_check['terms_condition2'];
	            $hst_term3=$fetch_check['terms_condition3'];
	            $hst_term4=$fetch_check['terms_condition4'];
	            $hst_term5=$fetch_check['terms_condition5'];
	            $hst_term6=$fetch_check['terms_condition6'];
	            $hst_term7=$fetch_check['terms_condition7'];
	            $history=mysqli_query($con,"INSERT INTO tbl_dist_terms_conditions_history (`terms_conditions_id`,`distributor_id`,`terms_condition1`,`terms_condition2`,`terms_condition3`,`terms_condition4`,`terms_condition5`,`terms_condition6`,`terms_condition7`,`insert_datetime`) VALUES ('$condition_id','$session_dist_ver','$hst_term1','$hst_term2','$hst_term3','$hst_term4','$hst_term5','$hst_term6','$hst_term7','$cdate11')");
	        }
			$query=mysqli_query($con,"update tbl_dist_terms_conditions set terms_condition1='$terms1',terms_condition2='$terms2',terms_condition3='$terms3',terms_condition4='$terms4',terms_condition5='$terms5',update_datetime='$cdate11',terms_condition6='$terms6',terms_condition7='$terms7' where distributor_id='$ver'");
			$response['success']='1';
			$response['message']='Terms & Condition Successfully Updated';
		}
		else
		{
			$query = mysqli_query($con,"INSERT INTO `tbl_dist_terms_conditions`(`distributor_id`, `terms_condition1`, `terms_condition2`, `terms_condition3`, `terms_condition4`, `terms_condition5`, `insert_datetime`,`terms_condition6`,`terms_condition7`) VALUES ('$ver','$terms1','$terms2','$terms3','$terms4','$terms5','$cdate11','$terms6','$terms7')");
			$response['success']='1';
			$response['message']='Terms & Condition Successfully Inserted';
		}
	}
	else
	{
		$rs1=mysqli_query($con,"select * from tbl_dist_terms_conditions_hindi where distributor_id='$ver'");
		if(mysqli_num_rows($rs1)>0)
		{
			$check=mysqli_query($con,"SELECT * FROM `tbl_dist_terms_conditions_hindi` where distributor_id='$ver'");
            if(mysqli_num_rows($check)>0)
            {
                $fetch_check=mysqli_fetch_assoc($check);
                $condition_id=$fetch_check['terms_conditions_id'];
                $hst_term1=$fetch_check['terms_condition1'];
                $hst_term2=$fetch_check['terms_condition2'];
                $hst_term3=$fetch_check['terms_condition3'];
                $hst_term4=$fetch_check['terms_condition4'];
                $hst_term5=$fetch_check['terms_condition5'];
                $hst_term6=$fetch_check['terms_condition6'];
                $hst_term7=$fetch_check['terms_condition7'];
                $history=mysqli_query($con,"INSERT INTO tbl_dist_terms_conditions_hindi_history (`terms_conditions_id`,`distributor_id`,`terms_condition1`,`terms_condition2`,`terms_condition3`,`terms_condition4`,`terms_condition5`,`terms_condition6`,`terms_condition7`,`insert_datetime`) VALUES ('$condition_id','$session_dist_ver','$hst_term1','$hst_term2','$hst_term3','$hst_term4','$hst_term5','$hst_term6','$hst_term7','$cdate11')");
            }
			$query=mysqli_query($con,"update tbl_dist_terms_conditions_hindi set terms_condition1='$terms1',terms_condition2='$terms2',terms_condition3='$terms3',terms_condition4='$terms4',terms_condition5='$terms5',update_datetime='$cdate11',terms_condition6='$terms6',terms_condition7='$terms7' where distributor_id='$ver'");
			$response['success']='1';
			$response['message']='Terms & Condition Successfully Updated';
		}
		else
		{
			$query = mysqli_query($con,"INSERT INTO `tbl_dist_terms_conditions_hindi`(`distributor_id`, `terms_condition1`, `terms_condition2`, `terms_condition3`, `terms_condition4`, `terms_condition5`, `insert_datetime`,`terms_condition6`,`terms_condition7`) VALUES ('$ver','$terms1','$terms2','$terms3','$terms4','$terms5','$cdate11','$terms6','$terms7')");
			$response['success']='1';
			$response['message']='Terms & Condition Successfully Inserted';
		}
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>